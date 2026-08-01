"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { formatPhoneNumber } from "@/lib/utils";

const detailsSchema = z
  .object({
    name: z.string().min(2, "이름을 입력해주세요"),
    phone: z.string().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "올바른 휴대폰번호를 입력해주세요"),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
    passwordConfirm: z.string().min(1, "비밀번호를 다시 입력해주세요"),
    companyName: z.string().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });
type DetailsInput = z.infer<typeof detailsSchema>;

type Step = "email" | "code" | "details" | "done";

export default function SignupPage() {
  const supabase = createClient();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DetailsInput>({ resolver: zodResolver(detailsSchema) });

  // ---- 1단계: 이메일 입력 + 인증코드 발송 ----
  const sendCode = async () => {
    setEmailError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("올바른 이메일을 입력해주세요.");
      return;
    }
    setSending(true);
    // shouldCreateUser: true → 처음 가입하는 이메일도 코드를 받을 수 있습니다.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setSending(false);

    if (error) {
      setEmailError("인증코드 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setStep("code");
    startCooldown();
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  // ---- 2단계: 발송된 코드 확인 ----
  const verifyCode = async () => {
    setCodeError(null);
    if (code.trim().length < 6) {
      setCodeError("받으신 6자리 인증코드를 입력해주세요.");
      return;
    }
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setVerifying(false);

    if (error) {
      setCodeError("인증코드가 올바르지 않습니다. 다시 확인해주세요.");
      return;
    }
    // 이메일 소유 확인 완료 (이 시점부터 Supabase 세션이 생성됩니다)
    setStep("details");
  };

  // ---- 3단계: 나머지 정보 입력 + 비밀번호 설정 → 가입 신청 완료 ----
  const onSubmitDetails = async (values: DetailsInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // OTP로 생성된 계정에는 비밀번호가 없으므로 여기서 설정합니다.
    await supabase.auth.updateUser({ password: values.password });

    await supabase.from("profiles").insert({
      id: user.id,
      role: "agency",
      name: values.name,
      phone: values.phone,
      email,
      company_name: values.companyName ?? null,
      is_approved: false, // 관리자 승인 전까지 로그인/이용 불가
    });

    // 관리자 승인 전이므로 세션을 종료합니다.
    await supabase.auth.signOut();
    setStep("done");
  };

  return (
    <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-9 text-center">
          <p className="mb-3.5 text-xs font-semibold tracking-[3px] text-gold-deep">JOIN RICHLINK</p>
          <h1 className="mb-2 font-serif text-2xl font-semibold">분양담당자 회원가입</h1>
          {step === "email" && (
            <p className="text-[12.5px] leading-relaxed text-stone">
              실제 사용하는 이메일로 인증코드를 보내드립니다.
            </p>
          )}
        </div>

        {/* ---- 1단계 ---- */}
        {step === "email" && (
          <div className="text-center">
            <div className="mb-3.5 text-left">
              <label className="mb-1.5 block text-[12.5px] text-gray-600">이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 rounded border border-line px-3.5 py-3 text-sm outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending}
                  className="flex-shrink-0 whitespace-nowrap rounded bg-gold px-4 text-[13px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-60"
                >
                  {sending ? "발송 중..." : "코드 발송"}
                </button>
              </div>
              {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
            </div>
            <p className="mt-5 text-sm text-stone">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-semibold text-gold-deep">
                로그인
              </Link>
            </p>
          </div>
        )}

        {/* ---- 2단계 ---- */}
        {step === "code" && (
          <div className="text-center">
            <p className="mb-5 text-[13px] leading-relaxed text-stone">
              <b className="text-ink">{email}</b> 로 인증코드 6자리를 보내드렸습니다.
              <br />
              메일함에서 확인 후 아래에 입력해주세요.
            </p>
            <div className="mb-3.5 text-left">
              <label className="mb-1.5 block text-[12.5px] text-gray-600">인증코드</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="6자리 숫자"
                className="w-full rounded border border-line px-3.5 py-3 text-center text-lg tracking-[6px] outline-none focus:border-gold"
              />
              {codeError && <p className="mt-1 text-xs text-red-500">{codeError}</p>}
            </div>

            <button
              onClick={verifyCode}
              disabled={verifying}
              className="w-full rounded bg-gold py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-60"
            >
              {verifying ? "확인 중..." : "인증코드 확인"}
            </button>

            <button
              type="button"
              onClick={sendCode}
              disabled={resendCooldown > 0 || sending}
              className="mt-3 text-[12.5px] text-stone underline-offset-2 hover:text-gold-deep hover:underline disabled:opacity-50"
            >
              {resendCooldown > 0 ? `코드 재발송 (${resendCooldown}초 후 가능)` : "코드 다시 받기"}
            </button>
          </div>
        )}

        {/* ---- 3단계 ---- */}
        {step === "details" && (
          <form onSubmit={handleSubmit(onSubmitDetails)}>
            <div className="mb-5 rounded-md border border-gold-soft bg-[#FBF7EE] px-4 py-2.5 text-center text-[12.5px] text-gold-deep">
              ✓ {email} 인증 완료
            </div>

            <Field label="담당자 이름" required error={errors.name?.message}>
              <input {...register("name")} placeholder="이름을 입력하세요" className="w-full rounded border border-line px-3.5 py-3 text-sm outline-none focus:border-gold" />
            </Field>
            <Field label="소속(분양대행사 / 시행사)">
              <input {...register("companyName")} placeholder="예: 리치디앤씨" className="w-full rounded border border-line px-3.5 py-3 text-sm outline-none focus:border-gold" />
            </Field>
            <Field label="휴대폰번호" required error={errors.phone?.message}>
              <input
                {...register("phone")}
                onChange={(e) => setValue("phone", formatPhoneNumber(e.target.value), { shouldValidate: true })}
                maxLength={13}
                placeholder="010-0000-0000"
                className="w-full rounded border border-line px-3.5 py-3 text-sm outline-none focus:border-gold"
              />
            </Field>
            <Field label="비밀번호" required error={errors.password?.message}>
              <input {...register("password")} type="password" placeholder="8자 이상 입력하세요" className="w-full rounded border border-line px-3.5 py-3 text-sm outline-none focus:border-gold" />
            </Field>
            <Field label="비밀번호 확인" required error={errors.passwordConfirm?.message}>
              <input {...register("passwordConfirm")} type="password" placeholder="비밀번호를 다시 입력하세요" className="w-full rounded border border-line px-3.5 py-3 text-sm outline-none focus:border-gold" />
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1.5 w-full rounded bg-gold py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-60"
            >
              {isSubmitting ? "가입 처리 중..." : "가입 신청하기"}
            </button>
          </form>
        )}

        {/* ---- 완료 ---- */}
        {step === "done" && (
          <div className="text-center">
            <div className="mb-3.5 text-4xl">🕓</div>
            <h2 className="mb-2.5 text-lg font-semibold">가입 신청이 접수되었습니다</h2>
            <p className="mb-7 text-[13px] leading-relaxed text-stone">
              이메일 인증이 완료되었습니다. 이제 관리자 승인 후 로그인하실 수 있습니다.
            </p>
            <Link
              href="/login"
              className="mx-auto block max-w-[200px] rounded bg-gold py-3 text-[14px] font-semibold text-white transition-colors hover:bg-gold-deep"
            >
              로그인 화면으로
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 text-left">
      <label className="mb-1.5 block text-[12.5px] text-gray-600">
        {label} {required && <span className="text-[11px] font-semibold text-gold-deep">*(필수)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
