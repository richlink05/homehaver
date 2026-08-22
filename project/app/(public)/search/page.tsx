import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/search/SearchBar";
import { ListingFilter } from "@/components/listing/ListingFilter";
import { SortSelect } from "@/components/listing/SortSelect";
import { ListingGrid } from "@/components/listing/ListingGrid";
import { BannerPopup } from "@/components/banner/BannerPopup";

export const dynamic = "force-dynamic";


interface SearchPageProps {
  searchParams: {
    q?: string;
    region?: string | string[];
    type?: string | string[];
    status?: string | string[];
    sort?: string;
    page?: string;
  };
}

const SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
  recommend: { column: "like_count", ascending: false },
  recent: { column: "created_at", ascending: false },
  popular: { column: "like_count", ascending: false },
  views: { column: "view_count", ascending: false },
};

function toArray(v?: string | string[]) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = createClient();
  // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
  (supabase.rpc as any)("process_daily_deductions").then(({ error }: any) => {
    if (error) console.error("포인트 일일 차감 실패:", error);
  });
  const { q = "", sort = "recommend", page = "1" } = searchParams;

  // 검색어 통계 기록 (실제 검색어가 있을 때만)
  if (q.trim()) {
    // ⚠️ insert() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
    (supabase.from("search_log") as any).insert({ term: q.trim() }).then();
  }

  const types = toArray(searchParams.type);
  const statuses = toArray(searchParams.status);
  const pageSize = 12;
  const pageNum = Number(page);

  let query = supabase
    .from("listings")
    .select("*, regions(sido, sigungu)", { count: "exact" })
    .eq("is_approved", true);

  if (q) query = query.or(`title.ilike.%${q}%,address.ilike.%${q}%`);
  if (types.length) query = query.in("type", types);
  if (statuses.length) query = query.in("status", statuses);

  const { column, ascending } = SORT_MAP[sort] ?? SORT_MAP.recommend;
  query = query
    .order(column, { ascending })
    .range((pageNum - 1) * pageSize, pageNum * pageSize - 1);

  const { data: listings, count } = await query;

  const { data: banners } = await supabase
    .from("admin_banners")
    .select("id, image_url, link_url")
    .eq("is_active", true)
    .order("sort_order")
    .returns<{ id: string; image_url: string; link_url: string | null }[]>();

  return (
    <section>
      <BannerPopup banners={banners ?? []} />
      <div className="border-b border-line px-8 py-5">
        <div className="mx-auto max-w-[1240px]">
          <SearchBar initialValue={q} className="max-w-[560px]" />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1240px] grid-cols-[200px_1fr] gap-7 px-8 py-8 max-[860px]:grid-cols-1">
        <Suspense fallback={null}>
          <ListingFilter />
        </Suspense>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              검색결과 <b className="text-ink">{count ?? 0}</b>건
            </p>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>
          <ListingGrid listings={(listings as any) ?? []} />
        </div>
      </div>
    </section>
  );
}
