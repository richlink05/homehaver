"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function FindPasswordModal({ onClose }: { onClose: () => void }) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-[380px] rounded-lg bg-white p-6 shadow-xl">
        {!sent ? (
          <>
            <h3 className="mb-1.5 text-center font-serif text-[18px] font-semibold">비밀번호 찾기</h3>
            <p className="mb-5 text-center text-[12.5px] text-stone">
              가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다.
            </p>
            <div className="mb-4">
              <label className="mb-1.5 block text-[12.5px] text-gray-600">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="you@example.com"
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
                {loading ? "전송 중..." : "재설정 링크 받기"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-2.5 text-[32px]">📧</div>
            <p className="mb-1.5 text-[13.5px] text-gray-700">비밀번호 재설정 링크를 이메일로 보내드렸습니다.</p>
            <p className="mb-6 text-[12px] text-stone">메일함(스팸함 포함)을 확인해주세요.</p>
            <button onClick={onClose} className="w-full rounded bg-ink py-2.5 text-[13px] font-semibold text-white">
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
