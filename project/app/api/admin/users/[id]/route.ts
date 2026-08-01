import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/supabase/get-profile";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ data: null, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const me = await getProfileRole(supabase, user.id);

  if (me?.role !== "admin") {
    return NextResponse.json({ data: null, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { role, is_approved } = await req.json();
  const updatePayload: Record<string, unknown> = {};
  if (role !== undefined) updatePayload.role = role;
  if (is_approved !== undefined) updatePayload.is_approved = is_approved;

  const { data, error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
