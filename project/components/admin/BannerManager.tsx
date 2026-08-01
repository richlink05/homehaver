"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ image_url: "", link_url: "", sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!form.image_url) return;
    setSubmitting(true);
    await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ image_url: "", link_url: "", sort_order: 0 });
    setSubmitting(false);
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
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div>
      <div className="mb-7 grid grid-cols-[1fr_1fr_100px_auto] gap-3 rounded-lg border border-line bg-white p-4">
        <input
          placeholder="이미지 URL"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          className="rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-gold"
        />
        <input
          placeholder="연결 URL (선택)"
          value={form.link_url}
          onChange={(e) => setForm({ ...form, link_url: e.target.value })}
          className="rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-gold"
        />
        <input
          type="number"
          placeholder="순서"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          className="rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-gold"
        />
        <button
          onClick={handleCreate}
          disabled={submitting}
          className="rounded bg-gold px-4 text-[13px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-50"
        >
          배너 추가
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">이미지 URL</th>
              <th className="px-5 py-3 font-medium">연결 URL</th>
              <th className="px-5 py-3 font-medium">순서</th>
              <th className="px-5 py-3 font-medium">노출 상태</th>
              <th className="px-5 py-3 font-medium text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                <td className="max-w-[220px] truncate px-5 py-3.5 text-gray-600">{b.image_url}</td>
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
