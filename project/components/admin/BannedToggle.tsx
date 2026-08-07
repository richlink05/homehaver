"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BannedToggle({ userId, banned }: { userId: string; banned: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!banned) return null;

  const unban = async () => {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: false }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={unban}
      disabled={loading}
      className="ml-1.5 rounded bg-gold px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-50"
    >
      차단 해제
    </button>
  );
}
