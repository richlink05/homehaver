"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type ImageCategory = "썸네일" | "평면도" | "인프라";

export interface UploadedFile {
  file: File;
  previewUrl: string;
  category: ImageCategory;
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 3 * 1024 * 1024; // 3MB

export function ImageUploader({
  category,
  label,
  hint,
  multiple = true,
  files,
  onChange,
}: {
  category: ImageCategory;
  label: string;
  hint?: string;
  multiple?: boolean;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryFiles = files.filter((f) => f.category === category);

  const addFiles = (fileList: FileList) => {
    const rejected: string[] = [];
    const accepted = Array.from(fileList).filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        rejected.push(`${f.name} (jpg/png 파일만 업로드 가능)`);
        return false;
      }
      if (f.size > MAX_SIZE) {
        rejected.push(`${f.name} (3MB 이하만 업로드 가능)`);
        return false;
      }
      return true;
    });

    setError(rejected.length > 0 ? rejected.join(", ") + " — 업로드에서 제외되었습니다." : null);
    if (accepted.length === 0) return;

    const next = accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file), category }));
    const others = files.filter((f) => f.category !== category);

    if (multiple) {
      onChange([...others, ...categoryFiles, ...next]);
    } else {
      // 썸네일처럼 1장만 허용하는 경우, 새로 선택하면 기존 것을 교체합니다.
      onChange([...others, next[0]]);
    }
  };

  const removeAt = (i: number) => {
    const target = categoryFiles[i];
    onChange(files.filter((f) => f !== target));
  };

  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] text-gray-600">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        multiple={multiple}
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-lg border-[1.5px] border-dashed p-6 text-center text-[13px] transition-colors ${
          dragOver ? "border-gold bg-[#FBF7EE]" : "border-line text-stone hover:border-gold"
        }`}
      >
        {hint ?? "파일을 끌어놓거나 클릭하여 업로드하세요"}
        <div className="mt-1 text-[11.5px] text-stone">jpg, png · 3MB 이하{!multiple && " · 1장만 등록 가능"}</div>
      </div>

      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}

      {categoryFiles.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          {categoryFiles.map((f, i) => (
            <div key={i} className="relative h-[66px] w-[88px] overflow-hidden rounded-md border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.previewUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                className="absolute right-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-ink/70 text-[11px] text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 선택된 이미지 파일들을 Supabase Storage(listing-images 버킷)에 업로드하고
 * listing_images 테이블에 레코드를 생성합니다. 썸네일 이미지가 있으면
 * listings.thumbnail_url에도 그 주소를 반영합니다 (목록 카드/상세 상단 이미지용).
 */
export async function uploadListingImages(listingId: string, files: UploadedFile[]) {
  const supabase = createClient();
  let thumbnailUrl: string | null = null;

  // 카테고리별로 순서(sort_order)를 따로 매깁니다.
  const counters: Record<ImageCategory, number> = { 썸네일: 0, 평면도: 0, 인프라: 0 };

  for (const { file, category } of files) {
    const path = `${listingId}/${category}-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("listing-images").upload(path, file);
    if (uploadError) continue;

    const {
      data: { publicUrl },
    } = supabase.storage.from("listing-images").getPublicUrl(path);

    if (category === "썸네일") thumbnailUrl = publicUrl;

    // ⚠️ insert() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
    await (supabase.from("listing_images") as any).insert({
      listing_id: listingId,
      image_url: publicUrl,
      category,
      sort_order: counters[category]++,
    });
  }

  if (thumbnailUrl) {
    // ⚠️ update()도 동일한 이유로 any 우회
    await (supabase.from("listings") as any).update({ thumbnail_url: thumbnailUrl }).eq("id", listingId);
  }
}
