"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function FindIdModal({ onClose }: { onClose: () => void }) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("이름과 휴대폰번호를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
    const { data, error: rpcError } = await (supabase.rpc as any)("find_email_by_name_phone", {
      p_name: name.trim(),
      p_phone: phone.trim(),
    });
    setLoading(false);

    if (rpcError || !data) {
      setError("일치하는 회원 정보를 찾을 수 없습니다.");
      return;
    }
    const masked = (data as string).replace(/^(.{2}).+(@.+)$/, (_m: string, a: string, b: string) => a + "***" + b);
    setResult(masked);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-[380px] rounded-lg bg-white p-6 shadow-xl">
        {!result ? (
          <>
            <h3 className="mb-5 text-center font-serif text-[18px] font-semibold">아이디(이메일) 찾기</h3>
            <div className="mb-3.5">
              <label className="mb-1.5 block text-[12.5px] text-gray-600">이름</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="가입 시 등록한 이름"
                className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-gold"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-[12.5px] text-gray-600">휴대폰번호</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="010-0000-0000"
                className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-gold"
              />
            </div>
            {error && <p className="mb-3 text-[12.5px] text-red-500">{error}</p>}
            <div className="flex gap-2.5">
              <button onClick={onClose} className="flex-1 rounded border border-line py-2.5 text-[13px] text-gray-600">
                취소
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 rounded bg-gold py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? "확인 중..." : "찾기"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-2.5 text-[32px]">✓</div>
            <p className="mb-6 text-[13.5px] text-gray-700">
              회원님의 아이디(이메일)는
              <br />
              <b className="text-[15px] text-gold-deep">{result}</b>
              <br />
              입니다.
            </p>
            <button onClick={onClose} className="w-full rounded bg-ink py-2.5 text-[13px] font-semibold text-white">
              로그인 화면으로
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
