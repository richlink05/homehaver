"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Action = "activate" | "join_waitlist" | "stop_managing";

const RPC_NAME: Record<Action, string> = {
  activate: "activate_manager",
  join_waitlist: "join_waitlist",
  stop_managing: "stop_managing",
};

const LABEL: Record<Action, string> = {
  activate: "담당자로 활성화",
  join_waitlist: "담당자 신청하기",
  stop_managing: "광고 그만하기",
};

const CONFIRM_MESSAGE: Record<Action, string> = {
  activate: "이 현장의 담당자로 활성화하면 즉시 15,000P가 차감되며, 이후 매일 자동 차감됩니다. 진행하시겠습니까?",
  join_waitlist: "이미 다른 담당자가 있는 현장입니다. 대기자로 등록하시겠습니까? (최소 15,000P 보유 필요)",
  stop_managing: "이 현장의 광고를 그만하시겠습니까? 대기자가 있으면 다음 대기자에게 인계됩니다. (남은 포인트는 환불되지 않습니다)",
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
    const { error: rpcError } = await (supabase.rpc as any)(RPC_NAME[action], { p_listing_id: listingId });
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
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
