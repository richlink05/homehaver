"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApprovalActions({ listingId, approved }: { listingId: string; approved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async (approve: boolean) => {
    setLoading(true);
    await fetch(`/api/admin/listings/${listingId}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: approve }),
    });
    setLoading(false);
    router.refresh();
  };

  if (approved) {
    return (
      <button
        onClick={() => handleApprove(false)}
        disabled={loading}
        className="rounded border border-line px-3.5 py-1.5 text-xs text-gray-600 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
      >
        승인 취소
      </button>
    );
  }

  return (
    <button
      onClick={() => handleApprove(true)}
      disabled={loading}
      className="rounded bg-gold px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-50"
    >
      {loading ? "처리 중..." : "승인"}
    </button>
  );
}
