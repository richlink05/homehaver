import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

// 미들웨어에서는 쿠키 수정이 허용되므로, 여기서 세션을 미리 갱신해두면
// 이후 서버 컴포넌트(레이아웃/페이지) 렌더링 중에는 갱신이 필요 없어져
// "Cookies can only be modified in a Server Action or Route Handler" 에러가 나지 않습니다.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 세션이 만료 임박이면 여기서 미리 갱신되고, 새 토큰이 위 response 쿠키에 반영됩니다.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * 아래를 제외한 모든 경로에 적용합니다:
     * - _next/static, _next/image (Next.js 내부 리소스)
     * - favicon.ico, 이미지 파일
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
