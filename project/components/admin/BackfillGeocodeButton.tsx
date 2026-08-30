"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BackfillGeocodeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ total: number; success: number; failed: string[] } | null>(null);

  const run = async () => {
    if (!confirm("좌표가 없는 모든 현장의 주소를 좌표로 변환합니다. 진행하시겠습니까?")) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/backfill-geocode", { method: "POST" });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(json.error ?? "처리 중 오류가 발생했습니다.");
      return;
    }
    setResult(json);
    router.refresh();
  };

  return (
    <div className="mb-6">
      <button
        onClick={run}
        disabled={loading}
        className="rounded border border-line px-4 py-2 text-[13px] text-gray-600 transition-colors hover:border-gold-deep hover:text-gold-deep disabled:opacity-50"
      >
        {loading ? "좌표 계산 중..." : "좌표 없는 현장 일괄 계산"}
      </button>
      {result && (
        <p className="mt-2 text-[12.5px] text-stone">
          전체 {result.total}건 중 {result.success}건 성공
          {result.failed.length > 0 && ` · 실패 ${result.failed.length}건: ${result.failed.join(", ")}`}
        </p>
      )}
    </div>
  );
}
