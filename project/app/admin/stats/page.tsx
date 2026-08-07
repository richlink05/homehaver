import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminUI";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const supabase = createClient();

  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: visitRows } = await supabase
    .from("daily_visit_counts")
    .select("visit_date, count")
    .order("visit_date", { ascending: false })
    .limit(14)
    .returns<{ visit_date: string; count: number }[]>();

  const { data: allVisitRows } = await supabase.from("daily_visit_counts").select("count");
  const cumulativeVisitors = (allVisitRows ?? []).reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);

  const todayVisitors = (visitRows ?? []).find((r) => r.visit_date === todayStr)?.count ?? 0;

  const { count: listingCount } = await supabase.from("listings").select("id", { count: "exact", head: true });

  const { data: chargeRows } = await supabase
    .from("point_transactions")
    .select("amount")
    .eq("type", "충전")
    .returns<{ amount: number }[]>();
  const totalCharged = (chargeRows ?? []).reduce((sum, r) => sum + r.amount, 0);

  const chartData = [...(visitRows ?? [])].reverse();
  const maxCount = Math.max(1, ...chartData.map((d) => d.count));

  return (
    <div>
      <AdminPageHeader title="통계" description="방문자수와 누적 방문자수를 확인합니다." />

      <div className="mb-8 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">오늘 방문자</p>
          <p className="font-serif text-[24px] font-semibold text-gold-deep">{todayVisitors}명</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">누적 방문자</p>
          <p className="font-serif text-[24px] font-semibold">{cumulativeVisitors.toLocaleString("ko-KR")}명</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">등록된 현장</p>
          <p className="font-serif text-[24px] font-semibold">{(listingCount ?? 0).toLocaleString("ko-KR")}건</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">누적 충전금액</p>
          <p className="font-serif text-[24px] font-semibold">{totalCharged.toLocaleString("ko-KR")}원</p>
        </div>
      </div>

      <h4 className="mb-3.5 text-[13.5px] font-semibold">최근 14일 방문자 추이</h4>
      <div className="rounded-lg border border-line bg-white p-8">
        {chartData.length === 0 ? (
          <p className="py-14 text-center text-stone">아직 방문 기록이 없습니다.</p>
        ) : (
          <div className="flex h-[220px] items-end gap-2.5">
            {chartData.map((d) => {
              const isToday = d.visit_date === todayStr;
              const heightPct = Math.max(4, (d.count / maxCount) * 100);
              const label = `${Number(d.visit_date.slice(5, 7))}/${Number(d.visit_date.slice(8, 10))}`;
              return (
                <div key={d.visit_date} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[11px] text-gray-500">{d.count}</span>
                  <div
                    className={`w-full rounded-t ${isToday ? "bg-ink" : "bg-gold"}`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10.5px] text-stone">{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
