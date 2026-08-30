import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/supabase/get-profile";

export async function POST() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const profile = await getProfileRole(supabase, user.id);
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "카카오 REST API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  const targetsRes = await supabase
    .from("listings")
    .select("id, address")
    .is("lat", null)
    .not("address", "is", null);
  const targets = (targetsRes.data ?? []) as { id: string; address: string }[];

  let success = 0;
  const failed: string[] = [];

  for (const listing of targets) {
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(listing.address)}`,
        { headers: { Authorization: `KakaoAK ${apiKey}` } }
      );
      const data = await res.json();
      const doc = data.documents?.[0];

      if (!doc) {
        failed.push(`${listing.address} (좌표 못 찾음)`);
        continue;
      }

      // ⚠️ update() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
      const { error } = await (supabase.from("listings") as any)
        .update({ lat: parseFloat(doc.y), lng: parseFloat(doc.x) })
        .eq("id", listing.id);

      if (error) {
        failed.push(`${listing.address} (저장 실패: ${error.message})`);
      } else {
        success++;
      }
    } catch (e: any) {
      failed.push(`${listing.address} (${e.message})`);
    }
  }

  return NextResponse.json({ total: targets.length, success, failed });
}
