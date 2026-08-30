import { NextRequest, NextResponse } from "next/server";

// REST API 키는 서버에서만 사용하고 절대 클라이언트에 노출하지 않습니다
// (NEXT_PUBLIC_ 접두사가 없는 일반 서버 전용 환경변수로 등록해야 합니다).
export async function POST(req: NextRequest) {
  const { address } = await req.json();

  if (!address || typeof address !== "string") {
    return NextResponse.json({ error: "주소가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "카카오 REST API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      { headers: { Authorization: `KakaoAK ${apiKey}` } }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `카카오 API 오류: ${text}` }, { status: 500 });
    }

    const data = await res.json();
    const doc = data.documents?.[0];

    if (!doc) {
      return NextResponse.json({ error: "해당 주소의 좌표를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ lat: parseFloat(doc.y), lng: parseFloat(doc.x) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "좌표 변환 중 오류가 발생했습니다." }, { status: 500 });
  }
}
