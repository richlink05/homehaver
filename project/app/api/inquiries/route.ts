import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { listing_id, name, phone, message } = body;

  if (!listing_id || !name || !phone) {
    return NextResponse.json({ data: null, error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ⚠️ insert() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
  // .select()로 등록 직후 행을 다시 읽어오면, 비회원은 조회 권한이 없어(신청자 본인/담당자/
  // 관리자만 조회 가능) RLS에 막혀버립니다. 등록 응답에 전체 데이터를 돌려줄 필요는 없으므로
  // select() 없이 insert만 수행합니다.
  const { error } = await (supabase.from("inquiries") as any).insert({
    listing_id,
    name,
    phone,
    message,
    user_id: user?.id ?? null,
  });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true }, error: null }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listing_id");
  const supabase = createClient();

  let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false });
  if (listingId) query = query.eq("listing_id", listingId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
