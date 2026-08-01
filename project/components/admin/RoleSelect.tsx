"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLE_LABEL: Record<string, string> = { user: "일반회원", agency: "분양관계자", admin: "관리자" };

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = async (nextRole: string) => {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <select
      defaultValue={role}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded border border-line bg-white px-2.5 py-1.5 text-xs text-gray-700 disabled:opacity-50"
    >
      {Object.entries(ROLE_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
