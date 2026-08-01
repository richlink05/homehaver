import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "로그인이 필요합니다." }, { status: 401 });

  // 이 문의가 내가 담당(등록)한 현장으로 접수된 것인지 확인
  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("id, listings(agency_id)")
    .eq("id", params.id)
    .single<{ id: string; listings: { agency_id: string | null } | null }>();

  const ownerId = inquiry?.listings?.agency_id;
  if (!inquiry || ownerId !== user.id) {
    return NextResponse.json({ data: null, error: "권한이 없습니다." }, { status: 403 });
  }

  const { status } = await req.json();
  // ⚠️ update() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
  const { data, error } = await (supabase.from("inquiries") as any)
    .update({ status })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
