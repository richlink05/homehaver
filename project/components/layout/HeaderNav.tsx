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
    return (
      <>
        <Link href="/login">로그인</Link>
        <Link href="/signup">회원가입</Link>
      </>
    );
  }

  return (
    <>
      {role === "agency" && <Link href="/listings">내 현장</Link>}
      <Link href={role === "admin" ? "/admin/approvals" : "/mypage"}>
        {role === "admin" ? "관리자 콘솔" : "마이페이지"}
      </Link>
      <button onClick={handleLogout} className="text-sm">
        로그아웃
      </button>
    </>
  );
}
