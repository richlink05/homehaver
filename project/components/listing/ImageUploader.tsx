"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UploadedFile {
  file: File;
  previewUrl: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 3 * 1024 * 1024; // 3MB

export function ImageUploader({
  files,
  onChange,
}: {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (accepted.length > 0) {
      const next = accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
      onChange([...files, ...next]);
    }
  };

  const removeAt = (i: number) => {
    onChange(files.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        multiple
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
        className={`cursor-pointer rounded-lg border-[1.5px] border-dashed p-8 text-center text-[13px] transition-colors ${
          dragOver ? "border-gold bg-[#FBF7EE]" : "border-line text-stone hover:border-gold"
        }`}
      >
        대표 이미지, 평면도, 단지배치도 파일을 끌어놓거나 클릭하여 업로드하세요
        <div className="mt-1 text-[11.5px] text-stone">jpg, png · 3MB 이하</div>
      </div>

      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}

      {files.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          {files.map((f, i) => (
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
 * listing_images 테이블에 레코드를 생성합니다.
 */
export async function uploadListingImages(listingId: string, files: UploadedFile[]) {
  const supabase = createClient();

  for (let i = 0; i < files.length; i++) {
    const { file } = files[i];
    const path = `${listingId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("listing-images").upload(path, file);
    if (uploadError) continue;

    const {
      data: { publicUrl },
    } = supabase.storage.from("listing-images").getPublicUrl(path);

    // ⚠️ insert() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
    await (supabase.from("listing_images") as any).insert({
      listing_id: listingId,
      image_url: publicUrl,
      category: i === 0 ? "대표" : "평면도",
      sort_order: i,
    });
  }
}
