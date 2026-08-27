"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema, type ListingInput } from "@/lib/validators/listing.schema";
import { createClient } from "@/lib/supabase/client";
import { ImageUploader, uploadListingImages, type UploadedFile } from "@/components/listing/ImageUploader";

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; jibunAddress: string; zonecode: string }) => void;
        width?: string;
        height?: string;
      }) => { embed: (el: HTMLElement) => void };
    };
  }
}

type ExistingImage = { id: string; image_url: string; category: "썸네일" | "평면도" | "인프라" };

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<UploadedFile[]>([]);

  const [zipcode, setZipcode] = useState("");
  const [roadAddress, setRoadAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [showAddressLayer, setShowAddressLayer] = useState(false);
  const [manualAddressMode, setManualAddressMode] = useState(true); // 기존 주소가 있으니 기본은 직접입력 모드로 노출
  const addressLayerBodyRef = useRef<HTMLDivElement>(null);
  const addressDetailInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput>({ resolver: zodResolver(listingSchema) });

  // 현재 담당자 본인인지 확인하고, 기존 값을 폼에 채워 넣습니다.
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoadError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }

      const { data: listing, error } = await supabase
        .from("listings")
        .select(
          "*, builders(name, brand_name), listing_images(id, image_url, category)"
        )
        .eq("id", params.id)
        .single<Record<string, any>>();

      if (error || !listing) {
        setLoadError("현장 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      // 등록자였어도 담당자가 배정된 순간부터는 권한이 없습니다. 오직 현재 담당자만 수정 가능합니다.
      if (listing.agency_id !== user.id) {
        setLoadError("이 현장의 현재 담당자만 수정할 수 있습니다.");
        setLoading(false);
        return;
      }
      setAuthorized(true);

      setValue("title", listing.title);
      setValue("type", listing.type);
      setValue("status", listing.status);
      setValue("address", listing.address ?? "");
      setValue("moveInDate", listing.move_in_date ? listing.move_in_date.slice(0, 7) : "");
      setValue("priceMin", listing.price_min ? listing.price_min / 10000 : undefined);
      setValue("priceMax", listing.price_max ? listing.price_max / 10000 : undefined);
      setValue("areaMin", listing.area_min ?? undefined);
      setValue("areaMax", listing.area_max ?? undefined);
      setValue("unitCount", listing.unit_count ?? undefined);
      setValue("buildingCount", listing.building_count ?? undefined);
      setValue("topFloor", listing.top_floor ?? undefined);
      setValue("builderName", listing.builders?.name ?? "");
      setValue("brandName", listing.builders?.brand_name ?? "");
      setValue("managerName", listing.manager_name ?? "");
      setValue("managerPhone", listing.manager_phone ?? "");
      setValue("description", listing.description ?? "");
      setRoadAddress(listing.address ?? "");
      setExistingImages(listing.listing_images ?? []);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const openAddressSearch = () => {
    if (typeof window === "undefined" || !window.daum?.Postcode) {
      setManualAddressMode(true);
      return;
    }
    setShowAddressLayer(true);
  };

  useEffect(() => {
    if (!showAddressLayer || !addressLayerBodyRef.current || !window.daum?.Postcode) return;
    addressLayerBodyRef.current.innerHTML = "";
    new window.daum.Postcode({
      oncomplete: (data) => {
        const fullAddress = data.roadAddress || data.jibunAddress;
        setZipcode(data.zonecode);
        setRoadAddress(fullAddress);
        setValue("address", fullAddress, { shouldValidate: true });
        setShowAddressLayer(false);
        setManualAddressMode(false);
        setTimeout(() => addressDetailInputRef.current?.focus(), 100);
      },
      width: "100%",
      height: "100%",
    }).embed(addressLayerBodyRef.current);
  }, [showAddressLayer, setValue]);

  useEffect(() => {
    if (!addressDetail) return;
    const full = `${roadAddress} ${addressDetail}`;
    setValue("address", full, { shouldValidate: true });
  }, [addressDetail, roadAddress, setValue]);

  const removeExistingImage = async (img: ExistingImage) => {
    if (!confirm("이 이미지를 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("listing_images").delete().eq("id", img.id);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }
    setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const onSubmit = async (values: ListingInput) => {
    setSubmitError(null);

    // ⚠️ upsert() 인자 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
    const builderPayload = { name: values.builderName, brand_name: values.brandName };
    const builderResult = (await (supabase.from("builders") as any)
      .upsert(builderPayload, { onConflict: "name" })
      .select("id")
      .single()) as { data: { id: string } | null; error: { message: string } | null };

    if (builderResult.error) {
      setSubmitError(`시공사 정보 저장에 실패했습니다: ${builderResult.error.message}`);
      return;
    }

    const moveInDate = values.moveInDate ? `${values.moveInDate}-01` : null;

    // ⚠️ update() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
    const { error } = await (supabase.from("listings") as any)
      .update({
        title: values.title,
        type: values.type,
        status: values.status,
        address: values.address,
        move_in_date: moveInDate,
        price_min: values.priceMin * 10000,
        price_max: values.priceMax * 10000,
        area_min: values.areaMin ?? null,
        area_max: values.areaMax ?? null,
        unit_count: values.unitCount ?? null,
        building_count: values.buildingCount ?? null,
        top_floor: values.topFloor ?? null,
        builder_id: builderResult.data?.id,
        description: values.description,
        manager_name: values.managerName,
        manager_phone: values.managerPhone,
      })
      .eq("id", params.id);

    if (error) {
      setSubmitError(`수정 중 오류가 발생했습니다: ${error.message}`);
      return;
    }

    if (newImages.length > 0) {
      const { errors: imageErrors } = await uploadListingImages(params.id, newImages);
      if (imageErrors.length > 0) {
        setSubmitError(`현장 정보는 수정되었지만, 일부 이미지 업로드에 실패했습니다: ${imageErrors.join(" / ")}`);
        setTimeout(() => router.push(`/listing/${params.id}`), 3500);
        return;
      }
    }

    router.push(`/listing/${params.id}`);
  };

  if (loading) {
    return <div className="px-8 py-24 text-center text-stone">불러오는 중...</div>;
  }

  if (!authorized) {
    return (
      <div className="mx-auto max-w-[480px] px-8 py-24 text-center">
        <p className="mb-2 text-[15px] font-semibold">수정할 수 없습니다</p>
        <p className="text-[13px] text-red-500">{loadError}</p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />

      <section className="mx-auto max-w-[820px] px-8 py-12">
        <div className="mb-9">
          <h1 className="mb-1.5 font-serif text-[22px] font-semibold">현장 수정</h1>
          <p className="text-[13.5px] text-stone">
            수정한 내용은 별도 재승인 절차 없이 바로 반영됩니다. 노출 상태는 그대로 유지됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormSection title="기본 정보">
            <div className="col-span-2">
              <Field label="분양명" error={errors.title?.message}>
                <input {...register("title")} className="input" />
              </Field>
            </div>
            <Field label="분양종류">
              <select {...register("type")} className="input">
                <option value="아파트">아파트</option>
                <option value="오피스텔">오피스텔</option>
              </select>
            </Field>
            <Field label="분양상태">
              <select {...register("status")} className="input">
                <option value="분양예정">분양예정</option>
                <option value="분양중">분양중</option>
                <option value="마감">마감</option>
              </select>
            </Field>

            <div className="col-span-2">
              <label className="mb-1.5 block text-[12.5px] text-gray-600">주소</label>
              <div className="flex gap-2">
                <input
                  value={zipcode}
                  readOnly
                  placeholder="우편번호"
                  className="input w-[120px] cursor-not-allowed bg-mist text-gray-500"
                />
                <button
                  type="button"
                  onClick={openAddressSearch}
                  className="shrink-0 rounded border border-line px-4 text-[13px] text-gray-700 hover:bg-mist"
                >
                  주소 다시 검색
                </button>
              </div>
              <input
                value={roadAddress}
                readOnly={!manualAddressMode}
                onChange={(e) => manualAddressMode && setRoadAddress(e.target.value)}
                className={`input mt-2 ${!manualAddressMode ? "cursor-not-allowed bg-mist text-gray-500" : ""}`}
              />
              <input
                ref={addressDetailInputRef}
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="상세주소를 변경하려면 입력하세요 (동/호수 등)"
                className="input mt-2"
              />
              {errors.address?.message && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
            </div>

            <Field label="입주예정">
              <input {...register("moveInDate")} type="month" className="input" />
            </Field>
          </FormSection>

          <FormSection title="가격 · 시공사">
            <Field label="분양가 (최소, 만원)" error={errors.priceMin?.message}>
              <input {...register("priceMin")} type="number" className="input" />
            </Field>
            <Field label="분양가 (최대, 만원)" error={errors.priceMax?.message}>
              <input {...register("priceMax")} type="number" className="input" />
            </Field>
            <Field label="시공사" error={errors.builderName?.message}>
              <input {...register("builderName")} className="input" />
            </Field>
            <Field label="브랜드">
              <input {...register("brandName")} className="input" />
            </Field>
          </FormSection>

          <FormSection title="단지 정보">
            <Field label="공급면적 (최소, ㎡)" error={errors.areaMin?.message}>
              <input {...register("areaMin")} type="number" className="input" />
            </Field>
            <Field label="공급면적 (최대, ㎡)" error={errors.areaMax?.message}>
              <input {...register("areaMax")} type="number" className="input" />
            </Field>
            <Field label="총 세대수" error={errors.unitCount?.message}>
              <input {...register("unitCount")} type="number" className="input" />
            </Field>
            <Field label="총 동수" error={errors.buildingCount?.message}>
              <input {...register("buildingCount")} type="number" className="input" />
            </Field>
            <Field label="최고 층수" error={errors.topFloor?.message}>
              <input {...register("topFloor")} type="number" className="input" />
            </Field>
          </FormSection>

          <FormSection title="담당자 정보">
            <Field label="담당자 이름" error={errors.managerName?.message}>
              <input {...register("managerName")} className="input" />
            </Field>
            <Field label="담당자 연락처" error={errors.managerPhone?.message}>
              <input {...register("managerPhone")} className="input" />
            </Field>
          </FormSection>

          <FormSection title="상세 설명">
            <div className="col-span-2">
              <Field label="" error={errors.description?.message}>
                <textarea
                  {...register("description")}
                  placeholder="분양 혜택(무상 옵션, 발코니 확장 등)이 추가되면 여기에 반영해주세요"
                  className="input h-[130px] resize-none"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="이미지">
            <div className="col-span-2">
              {(["썸네일", "평면도", "인프라"] as const).map((cat) => {
                const items = existingImages.filter((i) => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="mb-4">
                    <p className="mb-2 text-[12.5px] text-gray-600">
                      등록된 {cat === "썸네일" ? "썸네일" : cat === "평면도" ? "평면도·단지배치도" : "교통·학군·인프라"}
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {items.map((img) => (
                        <div key={img.id} className="relative h-[80px] w-[110px] overflow-hidden rounded-md border border-line">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img)}
                            className="absolute right-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-ink/70 text-[11px] text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="col-span-2 flex flex-col gap-6 border-t border-line pt-5">
              <p className="text-[12.5px] text-stone">새 이미지를 추가하려면 아래에서 업로드하세요.</p>
              <ImageUploader
                category="썸네일"
                label="썸네일 교체 (선택)"
                hint="새로 올리면 기존 썸네일 대신 이 이미지가 대표로 노출됩니다"
                multiple={false}
                files={newImages}
                onChange={setNewImages}
              />
              <ImageUploader
                category="평면도"
                label="평면도 · 단지배치도 추가"
                files={newImages}
                onChange={setNewImages}
              />
              <ImageUploader category="인프라" label="교통 · 학군 · 인프라 추가" files={newImages} onChange={setNewImages} />
            </div>
          </FormSection>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded border border-line px-6 py-3 text-[13.5px] text-gray-600"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-gold px-7 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-60"
            >
              {isSubmitting ? "저장 중..." : "수정 저장"}
            </button>
          </div>
        </form>
      </section>

      {submitError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-[420px] rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-start gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-[13px] font-bold text-red-600">
                !
              </span>
              <p className="text-[13.5px] leading-relaxed text-gray-700">{submitError}</p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="mt-2 w-full rounded bg-ink py-2.5 text-[13.5px] font-semibold text-white"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {showAddressLayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5">
          <div className="flex max-h-[80vh] w-full max-w-[480px] flex-col overflow-hidden rounded-lg bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className="text-[14px] font-semibold">주소 검색</span>
              <button type="button" onClick={() => setShowAddressLayer(false)} className="text-gray-400 hover:text-ink">
                ✕
              </button>
            </div>
            <div ref={addressLayerBodyRef} className="h-[420px] w-full" />
          </div>
        </div>
      )}
    </>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-7">
      <h4 className="mb-4.5 text-sm font-semibold">{title}</h4>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-[12.5px] text-gray-600">{label}</label>}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
