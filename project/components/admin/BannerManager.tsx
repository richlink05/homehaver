"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 3 * 1024 * 1024;

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (f: File) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("jpg 또는 png 파일만 업로드할 수 있습니다.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("이미지는 3MB 이하만 업로드할 수 있습니다.");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleCreate = async () => {
    if (!file) {
      setError("배너 이미지를 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");

    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("banner-images").upload(path, file);
    if (uploadError) {
      setSubmitting(false);
      setError(`이미지 업로드 실패: ${uploadError.message}`);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("banner-images").getPublicUrl(path);

    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: publicUrl, link_url: linkUrl || null, sort_order: sortOrder }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "배너 등록에 실패했습니다.");
      return;
    }

    setFile(null);
    setPreview(null);
    setLinkUrl("");
    setSortOrder(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !is_active }),
    });
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("이 배너를 삭제하시겠습니까?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div>
      <div className="mb-7 rounded-lg border border-line bg-white p-5">
        <div className="mb-3.5 flex flex-wrap items-start gap-4">
          <div>
            <label className="mb-1.5 block text-[12.5px] text-gray-600">배너 이미지 (jpg/png, 3MB 이하)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="text-[13px]"
            />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="mt-2.5 h-[90px] rounded border border-line object-cover" />
            )}
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-[12.5px] text-gray-600">연결 URL (선택)</label>
            <input
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] text-gray-600">노출 순서</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-24 rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-gold"
            />
          </div>
        </div>

        {error && <p className="mb-3 text-[12.5px] text-red-500">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={submitting}
          className="rounded bg-gold px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-50"
        >
          {submitting ? "등록 중..." : "배너 추가"}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">미리보기</th>
              <th className="px-5 py-3 font-medium">연결 URL</th>
              <th className="px-5 py-3 font-medium">순서</th>
              <th className="px-5 py-3 font-medium">노출 상태</th>
              <th className="px-5 py-3 font-medium text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                <td className="px-5 py-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.image_url} alt="" className="h-11 w-20 rounded border border-line object-cover" />
                </td>
                <td className="max-w-[180px] truncate px-5 py-3.5 text-gray-600">{b.link_url ?? "-"}</td>
                <td className="px-5 py-3.5 text-gray-600">{b.sort_order}</td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => toggleActive(b.id, b.is_active)}
                    className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                      b.is_active ? "bg-gold text-white" : "bg-mist text-gray-500"
                    }`}
                  >
                    {b.is_active ? "노출중" : "숨김"}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => remove(b.id)} className="text-xs text-gray-400 hover:text-red-500">
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-stone">
                  등록된 배너가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
