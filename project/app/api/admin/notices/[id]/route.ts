import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/supabase/get-profile";

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const profile = await getProfileRole(supabase, user.id);
  return profile?.role === "admin";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  if (!(await requireAdmin(supabase))) {
    return NextResponse.json({ data: null, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  const body = await req.json();
  // ⚠️ update() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
  const { data, error } = await (supabase.from("admin_notices") as any).update(body).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  if (!(await requireAdmin(supabase))) {
    return NextResponse.json({ data: null, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  const { error } = await supabase.from("admin_notices").delete().eq("id", params.id);
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data: { success: true }, error: null });
}
