"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DaysPicker } from "@/components/exposure/DaysPicker";
import { exposurePrice, formatWon } from "@/lib/exposure";

type Mode = "claim" | "extend";

const CONFIG: Record<Mode, { rpc: string; button: string; title: string; desc: string; submit: string }> = {
  claim: {
    rpc: "claim_listing",
    button: "현장 선점하고 노출 신청",
    title: "노출 기간 선택",
    desc: "선점 후 24시간 안에 결제하셔야 노출됩니다. 결제하지 않으면 선점이 취소되고 다음 순번으로 넘어갑니다.",
    submit: "선점하기",
  },
  extend: {
    rpc: "request_extension",
    button: "기간 연장",
    title: "연장 기간 선택",
    desc: "현재 노출 종료 시각 뒤로 이어서 노출됩니다. 종료 전까지 결제하지 않으면 다음 순번 담당자에게 넘어갑니다.",
    submit: "연장 신청",
  },
};

// 본인 등록 현장 선점(claim) / 담당중인 현장 연장(extend) 버튼입니다.
export function ExposureActionButton({
  listingId,
  mode,
  className,
}: {
  listingId: string;
  mode: Mode;
  className?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const cfg = CONFIG[mode];
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
    const { error: rpcError } = await (supabase.rpc as any)(cfg.rpc, { p_listing_id: listingId, p_days: days });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.push("/mypage/payments");
    router.refresh();
  };

  return (
    <div className={className}>
      <button
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded bg-gold px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gold-deep"
      >
        {cfg.button}
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-5 text-left">
          <div className="w-full max-w-[400px] rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-1.5 text-[15px] font-semibold">{cfg.title}</h3>
            <p className="mb-4 text-[12.5px] leading-relaxed text-stone">{cfg.desc}</p>
            <DaysPicker value={days} onChange={setDays} />
            <p className="mt-3.5 rounded bg-mist px-3 py-2 text-[12px] text-gray-600">
              결제 금액 <b className="text-ink">{formatWon(exposurePrice(days))}</b> (하루 20,000원 × {days}일)
              <br />
              노출은 매일 오전 6시에 시작·종료됩니다.
            </p>
            {error && <p className="mt-3 text-[12.5px] text-red-500">{error}</p>}
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded border border-line py-2.5 text-[13px] text-gray-600"
              >
                취소
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 rounded bg-ink py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? "처리 중..." : cfg.submit}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
