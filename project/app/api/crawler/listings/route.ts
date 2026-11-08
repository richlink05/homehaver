import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { geocodeAddress } from "@/lib/geocode";
import { crawlerBatchSchema, type CrawlerListingInput } from "@/lib/validators/crawler-listing.schema";

// 파이썬 크롤러 전용 매물 등록 API입니다.
// - 인증: Authorization: Bearer {CRAWLER_API_SECRET} 헤더 필요 (cron 라우트와 동일한 방식)
// - 크롤러는 Supabase에 직접 연결하지 않고 이 API만 호출합니다.
// - service_role 키로 RLS를 우회해서 insert하므로, 아래에서 is_approved=false /
//   agency_id=null / source='crawled'를 코드로 강제합니다(요청값으로 덮어쓸 수 없음).
// - 중복 확인(이미 수집한 매물인지)은 크롤러 쪽에서 처리하기로 했으므로 이 API는
//   들어오는 요청을 그대로 새 매물로 insert합니다.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRAWLER_API_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "요청 본문이 올바른 JSON이 아닙니다." }, { status: 400 });
  }

  const parsed = crawlerBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "요청 형식이 올바르지 않습니다.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const results: Array<{
    client_ref?: string;
    success: boolean;
    listing_id?: string;
    error?: string;
  }> = [];

  for (const item of parsed.data.listings) {
    try {
      const listingId = await insertOneListing(supabase, item);
      results.push({ client_ref: item.client_ref, success: true, listing_id: listingId });
    } catch (e: any) {
      results.push({ client_ref: item.client_ref, success: false, error: e.message ?? "알 수 없는 오류" });
    }
  }

  const inserted = results.filter((r) => r.success).length;
  return NextResponse.json({
    ok: true,
    total: results.length,
    inserted,
    failed: results.length - inserted,
    results,
  });
}

async function insertOneListing(supabase: ReturnType<typeof createServiceClient>, item: CrawlerListingInput) {
  // 1) 시공사: name 기준으로 upsert해서 id를 구합니다 (사람 등록 폼과 동일한 방식).
  let builderId: string | null = null;
  if (item.builder_name) {
    const { data: builder, error: builderError } = await supabase
      .from("builders")
      .upsert({ name: item.builder_name, brand_name: item.brand_name ?? null }, { onConflict: "name" })
      .select("id")
      .single();
    if (builderError) throw new Error(`시공사 정보 저장 실패: ${builderError.message}`);
    builderId = builder.id;
  }

  // 2) 좌표: 넘어온 값이 없으면 주소로 자동 변환합니다. 실패해도 등록은 막지 않습니다
  //    (사람이 등록할 때와 동일한 정책 — 좌표는 나중에 관리자가 일괄 보정 가능).
  let lat = item.lat ?? null;
  let lng = item.lng ?? null;
  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if ((lat == null || lng == null) && item.address && kakaoKey) {
    const geo = await geocodeAddress(item.address, kakaoKey);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }
  }

  // 3) "YYYY-MM"만 왔으면 DB date 타입에 맞춰 1일자를 붙입니다.
  const moveInDate =
    item.move_in_date && /^\d{4}-\d{2}$/.test(item.move_in_date) ? `${item.move_in_date}-01` : item.move_in_date ?? null;

  // 4) 매물 insert. 아래 4개 값은 요청으로 들어온 값과 무관하게 항상 고정합니다.
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      agency_id: null, // 담당자 미배정 상태로 시작
      registrant_id: null, // 사람이 등록한 게 아니므로 비워둠
      source: "crawled",
      is_approved: false, // 관리자 승인 전까지 비노출 (기존 흐름과 동일)
      title: item.title,
      type: item.type,
      status: item.status,
      address: item.address,
      lat,
      lng,
      move_in_date: moveInDate,
      price_min: item.price_min ?? null,
      price_max: item.price_max ?? null,
      area_min: item.area_min ?? null,
      area_max: item.area_max ?? null,
      unit_count: item.unit_count ?? null,
      building_count: item.building_count ?? null,
      top_floor: item.top_floor ?? null,
      builder_id: builderId,
      description: item.description ?? null,
      thumbnail_url: item.thumbnail_url ?? null,
    })
    .select("id")
    .single();

  if (listingError || !listing) {
    throw new Error(`매물 저장 실패: ${listingError?.message ?? "알 수 없는 오류"}`);
  }

  // 5) 추가 이미지(평면도/인프라)가 있으면 listing_images에 연결합니다.
  if (item.images.length > 0) {
    const counters: Record<string, number> = { 평면도: 0, 인프라: 0 };
    const rows = item.images.map((img) => ({
      listing_id: listing.id,
      image_url: img.url,
      category: img.category,
      sort_order: counters[img.category]++,
    }));
    const { error: imagesError } = await supabase.from("listing_images").insert(rows);
    if (imagesError) {
      // 매물 자체는 이미 저장됐으니, 이미지 실패는 전체를 실패시키지 않고 메시지만 남깁니다.
      throw new Error(`매물은 저장됐지만(id: ${listing.id}) 이미지 저장에 실패했습니다: ${imagesError.message}`);
    }
  }

  return listing.id as string;
}
