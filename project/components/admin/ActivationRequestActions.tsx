"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ActivationRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const resolve = async (action: "승인" | "반려") => {
    const confirmMsg =
      action === "승인"
        ? "승인하면 신청자가 이 현장의 담당자로 즉시 활성화되고 15,000P가 차감됩니다. 진행하시겠습니까?"
        : "이 신청을 반려하시겠습니까?";
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
    const { error } = await (supabase.rpc as any)("resolve_activation_request", {
      p_request_id: requestId,
      p_action: action,
    });
    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => resolve("승인")}
        disabled={loading}
        className="rounded bg-gold px-4 py-1.5 text-xs font-semibold text-white hover:bg-gold-deep disabled:opacity-50"
      >
        승인
      </button>
      <button
        onClick={() => resolve("반려")}
        disabled={loading}
        className="rounded border border-line px-4 py-1.5 text-xs text-gray-600 hover:border-red-300 hover:text-red-500 disabled:opacity-50"
      >
        반려
      </button>
    </div>
  );
}
