"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[380px]">
        <h1 className="mb-8 text-center font-serif text-2xl font-semibold">비밀번호 재설정</h1>

        {done ? (
          <p className="text-center text-[13.5px] text-gray-700">
            비밀번호가 변경되었습니다. 잠시 후 로그인 화면으로 이동합니다.
          </p>
        ) : (
          <>
            <div className="mb-3.5 text-left">
              <label className="mb-1.5 block text-[12.5px] text-gray-600">새 비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상 입력하세요"
                className="w-full rounded border border-line px-3.5 py-3 text-sm outline-none focus:border-gold"
              />
            </div>
            <div className="mb-4 text-left">
              <label className="mb-1.5 block text-[12.5px] text-gray-600">새 비밀번호 확인</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="새 비밀번호를 다시 입력하세요"
                className="w-full rounded border border-line px-3.5 py-3 text-sm outline-none focus:border-gold"
              />
            </div>
            {error && <p className="mb-3 text-left text-xs text-red-500">{error}</p>}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full rounded bg-gold py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-60"
            >
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
