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
  const { data, error } = await (supabase.from("inquiries") as any)
    .insert({ listing_id, name, phone, message, user_id: user?.id ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null }, { status: 201 });
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
