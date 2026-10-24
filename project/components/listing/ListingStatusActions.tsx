"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Action = "join_waitlist" | "stop_managing";

const RPC_NAME: Record<Action, string> = {
  join_waitlist: "join_waitlist",
  stop_managing: "stop_managing",
};

const LABEL: Record<Action, string> = {
  join_waitlist: "담당자 신청하기",
  stop_managing: "광고 중단 · 환불 요청",
};

const CONFIRM_MESSAGE: Record<Action, string> = {
  join_waitlist: "이미 다른 담당자가 있는 현장입니다. 대기자로 등록하시겠습니까?",
  stop_managing:
    "광고를 중단하고 남은 기간을 환불 요청하시겠습니까?\n\n· 지금부터 다음 오전 6시까지는 계속 노출됩니다.\n· 그 이후 남은 일수만큼 환불 대기로 접수되며, 관리자가 환불 처리합니다.\n· 중단 후에는 다음 순번 담당자에게 넘어갑니다.",
};

export function ListingStatusActions({
  listingId,
  action,
  className,
}: {
  listingId: string;
  action: Action;
  className?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!confirm(CONFIRM_MESSAGE[action])) return;
    setError(null);
    setLoading(true);

    // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
    const { data, error: rpcError } = await (supabase.rpc as any)(RPC_NAME[action], { p_listing_id: listingId });
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    if (action === "stop_managing") {
      const refund = typeof data === "number" ? data : 0;
      alert(
        refund > 0
          ? `접수되었습니다. 환불 예정 금액은 ${refund.toLocaleString("ko-KR")}원이며, 관리자 확인 후 환불됩니다.`
          : "접수되었습니다. 환불 대상 기간은 없습니다."
      );
    }
    router.refresh();
  };

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`rounded px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
          action === "stop_managing"
            ? "border border-line text-gray-500 hover:border-red-300 hover:text-red-500"
            : "bg-gold text-white hover:bg-gold-deep"
        }`}
      >
        {loading ? "처리 중..." : LABEL[action]}
      </button>
      {error && <p className="mt-1.5 text-[11.5px] text-red-500">{error}</p>}
    </div>
  );
}
