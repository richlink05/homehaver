"use client";

import { useState } from "react";
import { formatPhoneNumber } from "@/lib/utils";

export function ConsultForm({ listingId, listingTitle }: { listingId: string; listingTitle: string }) {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return;
    setError(null);
    setStatus("loading");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, ...form }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "알 수 없는 오류가 발생했습니다.");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch (e) {
      setError("네트워크 오류로 신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <aside className="sticky top-[100px] h-max rounded-lg border border-line p-7 text-center">
        <p className="mb-1.5 font-serif text-lg font-semibold">신청이 완료되었습니다</p>
        <p className="text-[13px] text-stone">
          {listingTitle} 담당자가 확인 후 곧 연락드리겠습니다.
        </p>
      </aside>
    );
  }

  return (
    <aside className="sticky top-[100px] h-max rounded-lg border border-line p-7">
      <h4 className="mb-1.5 font-serif text-xl font-semibold">상담 신청</h4>
      <p className="mb-5.5 text-[13px] text-stone">전문 분양 상담사가 직접 안내해 드립니다.</p>

      <input
        placeholder="이름"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="mb-3 w-full rounded border border-line px-3.5 py-2.5 text-[13.5px] outline-none focus:border-gold"
      />
      <input
        placeholder="연락처"
        value={form.phone}
        maxLength={13}
        onChange={(e) => setForm({ ...form, phone: formatPhoneNumber(e.target.value) })}
        className="mb-3 w-full rounded border border-line px-3.5 py-2.5 text-[13.5px] outline-none focus:border-gold"
      />
      <textarea
        placeholder="문의내용을 남겨주세요"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="mb-3 h-20 w-full resize-none rounded border border-line px-3.5 py-2.5 text-[13.5px] outline-none focus:border-gold"
      />
      <button
        onClick={handleSubmit}
        disabled={status === "loading"}
        className="w-full rounded bg-ink py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-60"
      >
        {status === "loading" ? "신청 중..." : "상담 신청하기"}
      </button>
      {error && <p className="mt-2.5 text-center text-[12.5px] text-red-500">{error}</p>}
      <p className="mt-3 text-center text-[11.5px] leading-[1.6] text-stone">
        신청하신 정보는 상담 목적으로만 사용되며
        <br />
        제3자에게 제공되지 않습니다.
      </p>
    </aside>
  );
}
