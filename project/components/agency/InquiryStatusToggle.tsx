"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InquiryStatusToggle({ inquiryId, status }: { inquiryId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const next = status === "응답완료" ? "대기" : "응답완료";
    await fetch(`/api/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        status === "응답완료"
          ? "border border-line text-gray-600 hover:border-ink hover:text-ink"
          : "bg-gold text-white hover:bg-gold-deep"
      }`}
    >
      {status === "응답완료" ? "대기로 변경" : "응답완료 처리"}
    </button>
  );
}
