import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { listing_id } = await req.json();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ data: null, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("listing_id", listing_id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (existing) {
    await (supabase.from("favorites") as any).delete().eq("id", existing.id);
    return NextResponse.json({ data: { favorited: false }, error: null });
  }

  // ⚠️ insert() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
  await (supabase.from("favorites") as any).insert({ listing_id, user_id: user.id });
  return NextResponse.json({ data: { favorited: true }, error: null });
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: [], error: null });

  const { data } = await supabase.from("favorites").select("listings(*)").eq("user_id", user.id);
  return NextResponse.json({ data, error: null });
}
