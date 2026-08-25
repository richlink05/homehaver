"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function HeaderNav({
  isLoggedIn,
  role,
}: {
  isLoggedIn: boolean;
  role?: "user" | "agency" | "admin";
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh(); // 서버 컴포넌트(레이아웃 포함)가 최신 로그인 상태를 다시 읽도록 합니다.
  };

  if (!isLoggedIn) {
    // 일반 방문자에게는 로그인/회원가입이 필요 없어(분양담당자 전용 기능이라 별도로 안내함) 아무것도 보여주지 않습니다.
    return null;
  }

  return (
    <>
      <Link href={role === "admin" ? "/admin/approvals" : "/mypage"}>
        {role === "admin" ? "관리자 콘솔" : "마이페이지"}
      </Link>
      <button onClick={handleLogout} className="text-sm">
        로그아웃
      </button>
    </>
  );
}
