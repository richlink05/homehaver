"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema, type ListingInput } from "@/lib/validators/listing.schema";
import { createClient } from "@/lib/supabase/client";
import { ImageUploader, uploadListingImages, type UploadedFile } from "@/components/listing/ImageUploader";

// Daum 우편번호 서비스가 window에 심어주는 전역 객체 타입
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

export default function NewListingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name: string; phone: string } | null>(null);

  // ---- 주소 검색(다음 우편번호) 상태 ----
  const [zipcode, setZipcode] = useState("");
  const [roadAddress, setRoadAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [showAddressLayer, setShowAddressLayer] = useState(false);
  const [manualAddressMode, setManualAddressMode] = useState(false);
  const addressLayerBodyRef = useRef<HTMLDivElement>(null);
  const addressDetailInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput>({ resolver: zodResolver(listingSchema) });

  // 담당자 정보는 회원가입 시 등록한 이름·연락처로 고정합니다.
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("name, phone")
        .eq("id", user.id)
        .single<{ name: string | null; phone: string | null }>();
      if (data) {
        setProfile({ name: data.name ?? "", phone: data.phone ?? "" });
        setValue("managerName", data.name ?? "");
        setValue("managerPhone", data.phone ?? "");
      }
    })();
  }, [supabase, setValue]);

  // ---- 다음 우편번호 검색 ----
  const openAddressSearch = () => {
    if (typeof window === "undefined" || !window.daum?.Postcode) {
      // 주소 검색 서비스를 불러오지 못한 경우, 직접 입력으로 전환합니다.
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
        setTimeout(() => addressDetailInputRef.current?.focus(), 100);
      },
      width: "100%",
      height: "100%",
    }).embed(addressLayerBodyRef.current);
  }, [showAddressLayer, setValue]);

  // 상세주소가 바뀔 때마다 최종 address 값(도로명 + 상세)을 폼에 반영합니다.
  useEffect(() => {
    const full = addressDetail ? `${roadAddress} ${addressDetail}` : roadAddress;
    setValue("address", full, { shouldValidate: !!full });
  }, [roadAddress, addressDetail, setValue]);

  const onSubmit = async (values: ListingInput) => {
    setSubmitError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError("로그인이 필요합니다.");
      return;
    }

    // ⚠️ upsert()는 이 프로젝트의 postgrest-js 버전에서 입력값 타입 추론이 계속
    // 깨지는 문제가 있어(onConflict 옵션과 결합 시 never[]로 오추론), 이 호출만
    // 타입 추론을 우회합니다. 실제 컬럼(name, brand_name)은 그대로 전달됩니다.
    const builderPayload = { name: values.builderName, brand_name: values.brandName };
    const builderResult = (await (supabase.from("builders") as any)
      .upsert(builderPayload, { onConflict: "name" })
      .select("id")
      .single()) as { data: { id: string } | null; error: { message: string } | null };

    if (builderResult.error) {
      console.error("builder upsert error:", builderResult.error);
      setSubmitError(`시공사 정보 저장에 실패했습니다: ${builderResult.error.message}`);
      return;
    }
    const builder = builderResult.data;

    // <input type="month">는 "YYYY-MM" 형식이라, DB의 date 타입에 맞춰 1일자를 붙여줍니다.
    const moveInDate = values.moveInDate ? `${values.moveInDate}-01` : null;

    // 매물은 관리자 승인 전까지 is_approved=false 로 생성됩니다.
    // 담당자 정보는 폼 값이 아닌 로그인 계정(profile)의 값을 그대로 사용해 임의 변경을 막습니다.
    // ⚠️ insert()도 upsert()와 동일하게 이 프로젝트에서 입력값 타입 추론이 깨져 any로 우회합니다.
    const listingResult = (await (supabase.from("listings") as any)
      .insert({
        agency_id: user.id,
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
        builder_id: builder?.id,
        description: values.description,
        manager_name: profile?.name ?? values.managerName,
        manager_phone: profile?.phone ?? values.managerPhone,
        is_approved: false,
      })
      .select("id")
      .single()) as { data: { id: string } | null; error: { message: string } | null };
    const { data: listing, error } = listingResult;

    if (error || !listing) {
      console.error("listing insert error:", error);
      setSubmitError(`등록 중 오류가 발생했습니다: ${error?.message ?? "알 수 없는 오류"}`);
      return;
    }

    // 첨부 이미지를 Storage에 업로드하고 listing_images에 연결
    if (images.length > 0) {
      await uploadListingImages(listing.id, images);
    }

    // "내가 등록한 현장" 목록 탭이 아직 없어서(포팅 예정), 방금 등록한 매물 상세로 이동합니다.
    // 승인 전이라도 본인이 등록한 매물은 본인 계정으로 조회할 수 있습니다.
    router.push(`/listing/${listing.id}`);
  };

  return (
    <>
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />

      <section className="mx-auto max-w-[820px] px-8 py-12">
        <div className="mb-9">
          <h1 className="mb-1.5 font-serif text-[22px] font-semibold">분양 등록</h1>
          <p className="text-[13.5px] text-stone">등록하신 분양 정보는 관리자 승인 후 검색결과에 노출됩니다.</p>
        </div>

        {submitError && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormSection title="기본 정보">
            <div className="col-span-2">
              <Field label="분양명" error={errors.title?.message}>
                <input {...register("title")} placeholder="예: 강남 리치타워 더 퍼스트" className="input" />
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
                  주소 검색
                </button>
              </div>
              <input
                value={roadAddress}
                readOnly={!manualAddressMode}
                onChange={(e) => manualAddressMode && setRoadAddress(e.target.value)}
                placeholder="주소 검색 버튼을 눌러 주소를 입력해주세요"
                className={`input mt-2 ${!manualAddressMode ? "cursor-not-allowed bg-mist text-gray-500" : ""}`}
              />
              <input
                ref={addressDetailInputRef}
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="상세주소 (동/호수 등)"
                className="input mt-2"
              />
              {errors.address?.message && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
              {!manualAddressMode && (
                <button
                  type="button"
                  onClick={() => setManualAddressMode(true)}
                  className="mt-1 text-[11.5px] text-stone underline"
                >
                  주소 검색이 안 되나요? 직접 입력하기
                </button>
              )}
            </div>

            <Field label="입주예정">
              <input {...register("moveInDate")} type="month" className="input" />
            </Field>
          </FormSection>

          <FormSection title="가격 · 시공사">
            <Field label="분양가 (최소, 만원)" error={errors.priceMin?.message}>
              <input {...register("priceMin")} type="number" placeholder="128000" className="input" />
            </Field>
            <Field label="분양가 (최대, 만원)" error={errors.priceMax?.message}>
              <input {...register("priceMax")} type="number" placeholder="185000" className="input" />
            </Field>
            <Field label="시공사" error={errors.builderName?.message}>
              <input {...register("builderName")} placeholder="리치건설(주)" className="input" />
            </Field>
            <Field label="브랜드">
              <input {...register("brandName")} placeholder="리치 더 퍼스트" className="input" />
            </Field>
          </FormSection>

          <FormSection title="단지 정보">
            <Field label="공급면적 (최소, ㎡)" error={errors.areaMin?.message}>
              <input {...register("areaMin")} type="number" placeholder="84" className="input" />
            </Field>
            <Field label="공급면적 (최대, ㎡)" error={errors.areaMax?.message}>
              <input {...register("areaMax")} type="number" placeholder="121" className="input" />
            </Field>
            <Field label="총 세대수" error={errors.unitCount?.message}>
              <input {...register("unitCount")} type="number" placeholder="412" className="input" />
            </Field>
            <Field label="총 동수" error={errors.buildingCount?.message}>
              <input {...register("buildingCount")} type="number" placeholder="4" className="input" />
            </Field>
            <Field label="최고 층수" error={errors.topFloor?.message}>
              <input {...register("topFloor")} type="number" placeholder="35" className="input" />
            </Field>
          </FormSection>

          <FormSection title="담당자 정보">
            <p className="col-span-2 -mt-2 mb-1 text-[12px] text-stone">
              회원가입 시 등록하신 이름·연락처로 자동 고정됩니다.
            </p>
            <Field label="담당자 이름">
              <input
                readOnly
                value={profile?.name ?? ""}
                className="input cursor-not-allowed bg-mist text-gray-500"
              />
            </Field>
            <Field label="담당자 연락처">
              <input
                readOnly
                value={profile?.phone ?? ""}
                className="input cursor-not-allowed bg-mist text-gray-500"
              />
            </Field>
          </FormSection>

          <FormSection title="상세 설명">
            <div className="col-span-2">
              <Field label="" error={errors.description?.message}>
                <textarea
                  {...register("description")}
                  placeholder="단지 특징, 커뮤니티, 교통, 학군 등을 소개해주세요"
                  className="input h-[110px] resize-none"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="이미지 업로드">
            <div className="col-span-2 flex flex-col gap-6">
              <ImageUploader
                category="썸네일"
                label="썸네일 (필수 1장)"
                hint="목록 카드와 상세페이지 상단에 노출되는 대표 이미지입니다"
                multiple={false}
                files={images}
                onChange={setImages}
              />
              <ImageUploader
                category="평면도"
                label="평면도 · 단지배치도"
                hint="상세페이지 '평면도 · 단지배치도' 탭에 노출됩니다"
                files={images}
                onChange={setImages}
              />
              <ImageUploader
                category="인프라"
                label="교통 · 학군 · 인프라"
                hint="상세페이지 '교통 · 학군 · 인프라' 탭에 노출됩니다"
                files={images}
                onChange={setImages}
              />
            </div>
          </FormSection>

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded border border-line px-6 py-3 text-[13.5px] text-gray-600">
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-gold px-7 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-60"
            >
              {isSubmitting ? "등록 중..." : "등록 신청"}
            </button>
          </div>
        </form>
      </section>

      {/* 다음 우편번호 검색 레이어 */}
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
