import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/supabase/get-profile";

export async function POST(req: NextRequest) {
  const { path } = await req.json();
  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "경로가 필요합니다." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // 관리자이거나, 본인이 올린 파일(경로 맨 앞이 자기 uid)인 경우만 허용합니다.
  const profile = await getProfileRole(supabase, user.id);
  const isOwner = path.startsWith(`${user.id}/`);
  if (profile?.role !== "admin" && !isOwner) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { data, error } = await supabase.storage.from("verification-docs").createSignedUrl(path, 300);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "URL 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
