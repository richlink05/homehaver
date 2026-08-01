"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Notice {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export function NoticeManager({ notices }: { notices: Notice[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", content: "", is_pinned: false });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!form.title || !form.content) return;
    setSubmitting(true);
    await fetch("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", content: "", is_pinned: false });
    setSubmitting(false);
    router.refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div>
      <div className="mb-7 space-y-3 rounded-lg border border-line bg-white p-4">
        <input
          placeholder="공지 제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-gold"
        />
        <textarea
          placeholder="공지 내용"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="h-24 w-full resize-none rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-gold"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[13px] text-gray-600">
            <input
              type="checkbox"
              checked={form.is_pinned}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
              className="accent-gold"
            />
            상단 고정
          </label>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="rounded bg-gold px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-50"
          >
            공지 등록
          </button>
        </div>
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
        {notices.map((n) => (
          <div key={n.id} className="flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                {n.is_pinned && (
                  <span className="rounded-full bg-gold px-2 py-0.5 text-[10.5px] font-semibold text-white">고정</span>
                )}
                <p className="text-[14px] font-semibold">{n.title}</p>
              </div>
              <p className="line-clamp-1 text-[13px] text-gray-500">{n.content}</p>
              <p className="mt-1 text-[11.5px] text-stone">{new Date(n.created_at).toLocaleDateString("ko-KR")}</p>
            </div>
            <button onClick={() => remove(n.id)} className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500">
              삭제
            </button>
          </div>
        ))}
        {notices.length === 0 && <p className="px-5 py-16 text-center text-stone">등록된 공지사항이 없습니다.</p>}
      </div>
    </div>
  );
}
