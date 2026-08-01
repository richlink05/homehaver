import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      "*, listing_images(*), listing_units(*), builders(name, brand_name), regions(sido, sigungu, dong)"
    )
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ data: null, error: "매물을 찾을 수 없습니다." }, { status: 404 });
  }

  // 조회수 증가 (비동기, 응답을 기다리지 않음)
  supabase.rpc("increment_view_count", { listing_id: params.id }).then();

  return NextResponse.json({ data, error: null });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabase
    .from("listings")
    .update(body)
    .eq("id", params.id)
    .eq("agency_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "로그인이 필요합니다." }, { status: 401 });

  const { error } = await supabase.from("listings").delete().eq("id", params.id).eq("agency_id", user.id);
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data: { success: true }, error: null });
}
