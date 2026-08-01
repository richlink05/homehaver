"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [loading, setLoading] = useState(false);

  const justVerified = searchParams.get("verified") === "1";

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setNeedsVerification(false);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      // Supabase는 이메일 미인증 계정 로그인 시도 시 이 문구를 반환합니다.
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setNeedsVerification(true);
        setError("이메일 인증이 완료되지 않았습니다. 받으신 메일의 링크를 먼저 클릭해주세요.");
      } else {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
      return;
    }
    if (!data.user) {
      setLoading(false);
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_approved")
      .eq("id", data.user.id)
      .single();

    if (profile && profile.is_approved === false) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("관리자 승인 대기 중인 계정입니다. 승인 완료 후 로그인해주세요.");
      return;
    }

    setLoading(false);
    router.push("/mypage");
  };

  const handleResend = async () => {
    if (!email) return;
    setResendState("sending");
    await supabase.auth.resend({ type: "signup", email });
    setResendState("sent");
  };

  return (
    <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px] text-center">
        <p className="mb-3.5 text-xs font-semibold tracking-[3px] text-gold-deep">WELCOME BACK</p>
        <h1 className="mb-9 font-serif text-2xl font-semibold">RichLink에 로그인</h1>

        {justVerified && (
          <div className="mb-6 rounded-md border border-gold-soft bg-[#FBF7EE] px-4 py-3 text-left text-[13px] text-gold-deep">
            ✓ 이메일 인증이 완료되었습니다. 관리자 승인 후 로그인하실 수 있습니다.
          </div>
        )}

        <div className="mb-3.5 text-left">
          <label className="mb-1.5 block text-[12.5px] text-gray-600">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded border border-line px-3.5 py-3 text-sm outline-none focus:border-gold"
          />
        </div>
        <div className="mb-3.5 text-left">
          <label className="mb-1.5 block text-[12.5px] text-gray-600">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="w-full rounded border border-line px-3.5 py-3 text-sm outline-none focus:border-gold"
          />
        </div>

        {error && <p className="mb-2 text-left text-xs text-red-500">{error}</p>}

        {needsVerification && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendState === "sending"}
            className="mb-3 w-full rounded border border-line py-2.5 text-[13px] text-gray-600 transition-colors hover:border-gold hover:text-gold-deep disabled:opacity-60"
          >
            {resendState === "sending" ? "재전송 중..." : resendState === "sent" ? "인증 메일을 다시 보냈습니다" : "인증 메일 다시 받기"}
          </button>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-1.5 w-full rounded bg-gold py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-60"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <p className="mt-5 text-sm text-stone">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-semibold text-gold-deep">
            회원가입
          </Link>
        </p>
      </div>
    </section>
  );
}
