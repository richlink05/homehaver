"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 관리자 결제 관리 버튼: 결제 확인(노출 시작 예약) / 환불 완료 처리
export function OrderActions({
  orderId,
  action,
}: {
  orderId: string;
  action: "confirm_payment" | "refund_done";
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const msg =
      action === "confirm_payment"
        ? "입금/결제를 확인하셨습니까? 결제 완료 처리하면 노출 일정이 확정됩니다."
        : "환불금을 돌려드린 것이 확인되면 환불 완료로 처리합니다. 진행하시겠습니까?";
    if (!confirm(msg)) return;
    setLoading(true);
    // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
    const { error } = await (supabase.rpc as any)(
      action === "confirm_payment" ? "confirm_exposure_payment" : "mark_refund_done",
      { p_order_id: orderId }
    );
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <button
      onClick={run}
      disabled={loading}
      className="rounded bg-gold px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-gold-deep disabled:opacity-50"
    >
      {loading ? "처리 중..." : action === "confirm_payment" ? "결제 확인" : "환불 완료"}
    </button>
  );
}
