import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/supabase/get-profile";

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await getProfileRole(supabase, user.id);
  return profile?.role === "admin" ? user : null;
}

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("admin_notices")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ data: null, error: "관리자 권한이 필요합니다." }, { status: 403 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("admin_notices")
    .insert({ ...body, created_by: admin.id })
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data, error: null }, { status: 201 });
}
