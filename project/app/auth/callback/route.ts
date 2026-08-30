import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase가 발송하는 인증 메일의 링크가 최종적으로 도착하는 주소입니다.
 * 링크에 담긴 code를 세션으로 교환한 뒤, 로그인 화면으로 안내합니다.
 *
 * Supabase 대시보드 설정 필요:
 *  - Authentication > URL Configuration > Redirect URLs 에
 *    `<사이트주소>/auth/callback` 을 등록해야 합니다.
 *    (예: http://localhost:3000/auth/callback, https://www.homehaver.com/auth/callback)
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 이메일 인증은 완료됐지만, 관리자 승인 전이라 바로 로그인시키지 않고
  // "인증 완료 · 승인 대기" 안내와 함께 로그인 화면으로 보냅니다.
  return NextResponse.redirect(`${origin}/login?verified=1`);
}
