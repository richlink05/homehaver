import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Vercel Cron이 매일 정해진 시각(vercel.json 참고)에 이 경로를 호출합니다.
// Vercel이 자동으로 Authorization: Bearer {CRON_SECRET} 헤더를 붙여서 보내므로,
// 그 값이 우리 환경변수 CRON_SECRET과 일치하는 요청만 실제로 처리합니다
// (그래야 이 URL을 아무나 호출해서 강제로 차감을 실행시키는 걸 막을 수 있습니다).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
  const { error } = await (supabase.rpc as any)("process_daily_deductions");

  if (error) {
    console.error("일일 포인트 차감 배치 실패:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
