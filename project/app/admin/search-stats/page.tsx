import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminUI";

export const dynamic = "force-dynamic";

export default async function SearchStatsPage({
  searchParams,
}: {
  searchParams: { period?: "day" | "week" | "month" };
}) {
  const supabase = createClient();
  const period = searchParams.period ?? "day";

  const now = new Date();
  const since = new Date(now);
  let rangeLabel = "";
  if (period === "day") {
    since.setHours(0, 0, 0, 0);
    rangeLabel = `오늘 검색 기준`;
  } else if (period === "week") {
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);
    rangeLabel = `최근 7일 검색 기준`;
  } else {
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);
    rangeLabel = `최근 30일 검색 기준`;
  }

  const { data: rows } = await supabase
    .from("search_log")
    .select("term")
    .gte("created_at", since.toISOString())
    .returns<{ term: string }[]>();

  const counts = new Map<string, number>();
  (rows ?? []).forEach((r) => {
    const term = r.term.trim();
    if (!term) return;
    counts.set(term, (counts.get(term) ?? 0) + 1);
  });
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

  return (
    <div>
      <AdminPageHeader title="검색어 통계" description="사용자들이 실제로 검색한 검색어를 기간별로 확인합니다." />

      <div className="mb-4 flex gap-2">
        {[
          { key: "day", label: "일간" },
          { key: "week", label: "주간" },
          { key: "month", label: "월간" },
        ].map((t) => (
          <a
            key={t.key}
            href={`/admin/search-stats?period=${t.key}`}
            className={`rounded-full px-4 py-1.5 text-[13px] ${
              period === t.key ? "bg-ink text-white" : "border border-line text-gray-600"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>
      <p className="mb-4 text-[12px] text-stone">{rangeLabel}</p>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="w-[70px] px-5 py-3 font-medium">순위</th>
              <th className="px-5 py-3 font-medium">검색어</th>
              <th className="px-5 py-3 text-right font-medium">검색 횟수</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(([term, count], i) => (
              <tr key={term} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      i < 3 ? "bg-gold text-white" : "bg-mist text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium">{term}</td>
                <td className="px-5 py-3 text-right text-gray-600">{count.toLocaleString("ko-KR")}회</td>
              </tr>
            ))}
            {ranked.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-16 text-center text-stone">
                  해당 기간에 검색된 검색어가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
