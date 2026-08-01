"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserApprovalToggle({ userId, approved }: { userId: string; approved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: !approved }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        approved
          ? "border border-line text-gray-600 hover:border-ink hover:text-ink"
          : "bg-gold text-white hover:bg-gold-deep"
      }`}
    >
      {approved ? "승인 취소" : "가입 승인"}
    </button>
  );
}
