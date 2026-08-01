"use client";

import { createClient } from "@/lib/supabase/client";

const PROVIDERS = [
  { id: "google", label: "Google", className: "bg-white text-[#4285F4] border border-line" },
  { id: "kakao", label: "Kakao", className: "bg-[#FEE500] text-ink" },
  { id: "naver", label: "Naver", className: "bg-[#03C75A] text-white" },
  { id: "apple", label: "Apple", className: "bg-ink text-white" },
] as const;

export function SocialLoginButtons() {
  const supabase = createClient();

  const handleLogin = async (provider: (typeof PROVIDERS)[number]["id"]) => {
    // Supabase supports google/apple natively; kakao/naver require custom OAuth provider setup.
    await supabase.auth.signInWithOAuth({
      provider: provider as "google" | "apple",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div className="mb-6 grid grid-cols-4 gap-2.5">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          onClick={() => handleLogin(p.id)}
          aria-label={`${p.label}로 로그인`}
          className={`flex aspect-square items-center justify-center rounded-[10px] text-xs font-semibold transition-transform hover:-translate-y-0.5 ${p.className}`}
        >
          {p.label[0]}
        </button>
      ))}
    </div>
  );
}
