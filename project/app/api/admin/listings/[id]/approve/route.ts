import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/supabase/get-profile";

async function assertAdmin(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const profile = await getProfileRole(supabase, user.id);
  return profile?.role === "admin";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  if (!(await assertAdmin(supabase))) {
    return NextResponse.json({ data: null, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { is_approved } = await req.json();

  const { data, error } = await supabase
    .from("listings")
    .update({ is_approved })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
