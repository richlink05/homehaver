import { z } from "zod";

// 크롤러가 보내는 매물 한 건의 추가 이미지입니다. 대표 썸네일은 thumbnail_url로 따로 받고,
// 평면도/인프라 이미지만 여기로 받습니다(사람 등록 폼과 동일한 카테고리 체계).
export const crawlerImageSchema = z.object({
  url: z.string().url("images[].url은 올바른 URL이어야 합니다."),
  category: z.enum(["평면도", "인프라"]).default("인프라"),
});

// 크롤러 전용 입력 스키마입니다. 사람이 쓰는 lib/validators/listing.schema.ts와 달리
// 담당자 정보(managerName 등)는 받지 않고(크롤링 매물은 담당자 미배정 상태로 들어감),
// 가격 단위도 폼처럼 "만원"이 아니라 DB와 동일한 "원" 단위 그대로 받습니다.
export const crawlerListingSchema = z.object({
  // 크롤러 쪽에서만 쓰는 식별자입니다. DB에는 저장하지 않고, 응답(results)에 그대로
  // 돌려줘서 어떤 요청이 어떤 결과인지 크롤러가 매칭할 수 있게 하기 위한 용도입니다.
  client_ref: z.string().max(200).optional(),

  title: z.string().min(2, "title은 2자 이상이어야 합니다."),
  type: z.enum(["아파트", "오피스텔", "생활형숙박시설", "지식산업센터", "상가"], {
    errorMap: () => ({ message: "type은 아파트/오피스텔/생활형숙박시설/지식산업센터/상가 중 하나여야 합니다." }),
  }),
  status: z
    .enum(["분양예정", "분양중", "마감"], {
      errorMap: () => ({ message: "status는 분양예정/분양중/마감 중 하나여야 합니다." }),
    })
    .default("분양예정"),
  address: z.string().min(2, "address가 필요합니다."),

  // 좌표를 직접 알고 있으면 넘겨도 되고(지오코딩 생략), 없으면 서버가 address로 자동 변환합니다.
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),

  // "YYYY-MM" 또는 "YYYY-MM-DD" 둘 다 허용(서버에서 자동 보정)
  move_in_date: z.string().optional().nullable(),

  // 원(KRW) 단위입니다. 예: 12.8억 → 1280000000
  price_min: z.number().nonnegative().optional().nullable(),
  price_max: z.number().nonnegative().optional().nullable(),
  area_min: z.number().positive().optional().nullable(),
  area_max: z.number().positive().optional().nullable(),
  unit_count: z.number().int().positive().optional().nullable(),
  building_count: z.number().int().positive().optional().nullable(),
  top_floor: z.number().int().positive().optional().nullable(),

  // name 기준으로 builders 테이블에 upsert됩니다(서버가 알아서 id를 찾거나 새로 만듦).
  builder_name: z.string().optional().nullable(),
  brand_name: z.string().optional().nullable(),

  description: z.string().optional().nullable(),

  // 대표 썸네일. 파일 업로드가 아니라 URL 문자열만 받습니다.
  thumbnail_url: z.string().url("thumbnail_url은 올바른 URL이어야 합니다.").optional().nullable(),
  images: z.array(crawlerImageSchema).max(30).optional().default([]),
});

export type CrawlerListingInput = z.infer<typeof crawlerListingSchema>;

export const crawlerBatchSchema = z.object({
  // 한 번 요청에 최대 50건까지. 더 많으면 여러 번 나눠서 보내주세요(타임아웃 방지).
  listings: z.array(crawlerListingSchema).min(1, "listings 배열이 비어있습니다.").max(50, "한 번에 최대 50건까지 보낼 수 있습니다."),
});
