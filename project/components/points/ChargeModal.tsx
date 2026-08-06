"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MIN_CHARGE = 30000;

export function ChargeModal() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(MIN_CHARGE);
  const [method, setMethod] = useState<"무통장입금" | "카드결제">("무통장입금");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCharge = async () => {
    setError(null);
    if (!amount || amount < MIN_CHARGE) {
      setError(`최소 충전금액은 ${MIN_CHARGE.toLocaleString("ko-KR")}원입니다.`);
      return;
    }

    setLoading(true);
    // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
    const { error: rpcError } = await (supabase.rpc as any)("add_points", {
      p_amount: amount,
      p_type: "충전",
      p_note: `${method} 충전`,
    });
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => {
          setAmount(MIN_CHARGE);
          setError(null);
          setOpen(true);
        }}
        className="rounded bg-gold px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-gold-deep"
      >
        + 포인트 충전
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-[380px] rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-1 font-serif text-[18px] font-semibold">포인트 충전</h3>
            <p className="mb-5 text-[12.5px] text-stone">1원 = 1포인트 · 최소 충전금액 30,000원</p>

            <label className="mb-1.5 block text-[12.5px] text-gray-600">충전 금액 (원)</label>
            <input
              type="number"
              value={amount}
              min={MIN_CHARGE}
              step={10000}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mb-4 w-full rounded border border-line px-3 py-2.5 text-[14px] outline-none focus:border-gold"
            />

            <div className="mb-5 flex gap-2">
              {(["무통장입금", "카드결제"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex-1 rounded border py-2 text-[13px] transition-colors ${
                    method === m ? "border-ink bg-ink text-white" : "border-line text-gray-600"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <p className="mb-5 rounded bg-mist px-3 py-2 text-[11.5px] text-stone">
              ※ 데모 환경이라 실제 결제 없이 바로 충전됩니다.
            </p>

            {error && <p className="mb-3 text-[12.5px] text-red-500">{error}</p>}

            <div className="flex gap-2.5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded border border-line py-2.5 text-[13px] text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleCharge}
                disabled={loading}
                className="flex-1 rounded bg-ink py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? "처리 중..." : "충전하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
