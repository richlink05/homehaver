import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Vercel Cron이 매일 한국시간 오전 6시(= UTC 21:00, vercel.json 참고)에 호출합니다.
// 하는 일: 결제기한(24시간) 지난 주문 만료 → 노출 시작/종료 처리 → 다음 순번 담당자에게 결제 기회 부여.
// Vercel이 자동으로 Authorization: Bearer {CRON_SECRET} 헤더를 붙여 보내므로, 그 값이 일치하는 요청만 처리합니다.
// (무료 플랜 크론은 정각에서 최대 1시간까지 늦게 실행될 수 있어, 사이트 방문 시에도 같은 처리를 보조로 실행합니다. middleware.ts 참고)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
  const { error } = await (supabase.rpc as any)("process_exposure_lifecycle");

  if (error) {
    console.error("노출 기간 처리 배치 실패:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
