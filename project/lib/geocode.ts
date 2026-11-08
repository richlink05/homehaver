// 주소 → 좌표 변환(카카오 주소 검색) 공통 함수입니다.
// 크롤링으로 들어온 주소는 "경기도 화성특례시 동탄구 반송동 95번지[동탄(1) M1-1-2블록]"처럼
// 번지 표기나 [블록 정보]가 붙어 있어 그대로는 카카오가 못 찾는 경우가 많습니다.
// 그래서 원본 주소로 먼저 찾고, 실패하면 아래처럼 단계적으로 정리한 주소로 다시 시도합니다.

export function addressCandidates(raw: string): string[] {
  const original = raw.trim().replace(/\s+/g, " ");
  const list: string[] = [original];

  // 1) [ ... ] 또는 ( ... ) 안의 부가 설명 제거: "...95번지[동탄(1) M1-1-2블록]" → "...95번지"
  let step = original.replace(/\[[^\]]*\]?/g, " ").replace(/\([^)]*\)?/g, " ").replace(/\s+/g, " ").trim();
  list.push(step);

  // 2) "95번지" → "95", "95-3번지" → "95-3"
  step = step.replace(/(\d)\s*번지/g, "$1").replace(/\s+/g, " ").trim();
  list.push(step);

  // 3) "화성특례시" → "화성시" (카카오가 아직 옛 행정명칭만 쓰는 경우 대비)
  const noSpecial = step.replace(/([가-힣]+)특례시/g, "$1시");
  list.push(noSpecial);

  // 4) 일반구/신설구를 뺀 형태: "경기도 화성시 동탄구 반송동 95" → "경기도 화성시 반송동 95"
  list.push(noSpecial.replace(/([가-힣]{1,4}(?<!특별)(?<!광역)시)\s+[가-힣]+구\s+/, "$1 "));

  // 5) 번지 뒤에 남은 글자(동 이름 뒤 "일원", "일대" 등) 제거: "○○동 95 일원" → "○○동 95"
  list.push(noSpecial.replace(/\s*(일원|일대|외\s*\d*필지|외)\s*$/, ""));

  return [...new Set(list.filter((s) => s.length >= 2))];
}

async function searchOnce(query: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) return null;
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
}

// 후보 주소를 순서대로 시도해서 처음 찾아지는 좌표를 돌려줍니다. 끝까지 못 찾으면 null.
export async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  for (const q of addressCandidates(address)) {
    try {
      const hit = await searchOnce(q, apiKey);
      if (hit) return hit;
    } catch {
      // 네트워크 오류 등은 다음 후보로 넘어갑니다.
    }
  }
  return null;
}
