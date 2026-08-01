"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema, type ListingInput } from "@/lib/validators/listing.schema";
import { createClient } from "@/lib/supabase/client";
import { ImageUploader, uploadListingImages, type UploadedFile } from "@/components/listing/ImageUploader";

export default function NewListingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name: string; phone: string } | null>(null);

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

  const onSubmit = async (values: ListingInput) => {
    setSubmitError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError("로그인이 필요합니다.");
      return;
    }

    const { data: builder } = await supabase
      .from("builders")
      .upsert({ name: values.builderName, brand_name: values.brandName }, { onConflict: "name" })
      .select("id")
      .single<{ id: string }>();

    // 매물은 관리자 승인 전까지 is_approved=false 로 생성됩니다.
    // 담당자 정보는 폼 값이 아닌 로그인 계정(profile)의 값을 그대로 사용해 임의 변경을 막습니다.
    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        agency_id: user.id,
        title: values.title,
        type: values.type,
        status: values.status,
        address: values.address,
        move_in_date: values.moveInDate || null,
        price_min: values.priceMin * 10000,
        price_max: values.priceMax * 10000,
        builder_id: builder?.id,
        description: values.description,
        manager_name: profile?.name ?? values.managerName,
        manager_phone: profile?.phone ?? values.managerPhone,
        is_approved: false,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !listing) {
      setSubmitError("등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    // 첨부 이미지를 Storage에 업로드하고 listing_images에 연결
    if (images.length > 0) {
      await uploadListingImages(listing.id, images);
    }

    router.push("/listings");
  };

  return (
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
              <option value="지식산업센터">지식산업센터</option>
              <option value="상가">상가</option>
            </select>
          </Field>
          <Field label="분양상태">
            <select {...register("status")} className="input">
              <option value="분양예정">분양예정</option>
              <option value="분양중">분양중</option>
              <option value="계약중">계약중</option>
              <option value="마감">마감</option>
            </select>
          </Field>
          <Field label="주소" error={errors.address?.message}>
            <input {...register("address")} placeholder="서울특별시 강남구 역삼동" className="input" />
          </Field>
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

        <FormSection title="이미지 · 평면도 업로드">
          <div className="col-span-2">
            <ImageUploader files={images} onChange={setImages} />
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
