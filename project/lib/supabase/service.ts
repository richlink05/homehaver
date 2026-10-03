import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * service_role 키를 사용하는 전용 클라이언트입니다.
 * RLS(행 단위 보안 정책)를 완전히 우회하므로, 반드시 서버 전용 코드
 * (API 라우트, 배치 작업 등)에서만 생성해야 하며 절대 브라우저로 내려주면 안 됩니다.
 *
 * 로그인한 사용자가 없는 요청(외부 크롤러 등)에서 listings를 직접 insert해야 할 때
 * 사용합니다. 일반 사용자 요청은 그대로 lib/supabase/server.ts(쿠키 기반, RLS 적용)를
 * 사용해야 합니다 — 이 클라이언트는 꼭 필요한 곳에서만 좁게 써야 합니다.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.");
  }

  return createSupabaseJsClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
