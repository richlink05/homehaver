import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminUI";

export const dynamic = "force-dynamic";

export default async function AdminPointsPage({
  searchParams,
}: {
  searchParams: { q?: string; historyType?: "전체" | "충전" | "사용"; historyQ?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q ?? "";
  const historyType = searchParams.historyType ?? "전체";
  const historyQ = searchParams.historyQ ?? "";

  type UserRow = { id: string; name: string | null; email: string | null; points: number };
  let userQuery = supabase
    .from("profiles")
    .select("id, name, email, points")
    .eq("role", "agency")
    .order("points", { ascending: false });
  if (q) userQuery = userQuery.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  const { data: users } = await userQuery.returns<UserRow[]>();

  const { data: managingRows } = await supabase
    .from("listings")
    .select("agency_id, title")
    .not("agency_id", "is", null)
    .returns<{ agency_id: string; title: string }[]>();
  const managingMap = new Map<string, string>();
  (managingRows ?? []).forEach((r) => managingMap.set(r.agency_id, r.title));

  const totalPoints = (users ?? []).reduce((sum, u) => sum + u.points, 0);

  type TxRow = {
    id: string;
    type: "충전" | "사용" | "환불";
    amount: number;
    note: string | null;
    created_at: string;
    profiles: { name: string | null; email: string | null } | null;
  };
  let txQuery = supabase
    .from("point_transactions")
    .select("id, type, amount, note, created_at, profiles(name, email)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (historyType !== "전체") txQuery = txQuery.eq("type", historyType);
  const { data: history } = await txQuery.returns<TxRow[]>();

  const filteredHistory = historyQ
    ? (history ?? []).filter(
        (h) =>
          h.profiles?.name?.includes(historyQ) ||
          h.profiles?.email?.includes(historyQ) ||
          h.note?.includes(historyQ)
      )
    : history ?? [];

  const totalCharged = (history ?? [])
    .filter((h) => h.type === "충전")
    .reduce((sum, h) => sum + h.amount, 0);
  const totalUsed = (history ?? [])
    .filter((h) => h.type === "사용")
    .reduce((sum, h) => sum + Math.abs(h.amount), 0);

  return (
    <div>
      <AdminPageHeader title="포인트관리" description="회원별 포인트 보유 현황과 충전·사용 내역을 검색하고 관리합니다." />

      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">전체 회원 보유 포인트</p>
          <p className="font-serif text-[24px] font-semibold text-gold-deep">
            {totalPoints.toLocaleString("ko-KR")}P
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">누적 충전금액</p>
          <p className="font-serif text-[24px] font-semibold">{totalCharged.toLocaleString("ko-KR")}원</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">누적 사용 포인트</p>
          <p className="font-serif text-[24px] font-semibold">{totalUsed.toLocaleString("ko-KR")}P</p>
        </div>
      </div>

      <h4 className="mb-3 text-[13.5px] font-semibold">회원별 포인트 보유 현황</h4>
      <form className="mb-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="이름 또는 이메일로 검색"
          className="w-72 rounded border border-line bg-white px-3.5 py-2 text-[13px] outline-none focus:border-gold"
        />
      </form>
      <div className="mb-9 overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">이름</th>
              <th className="px-5 py-3 font-medium">이메일</th>
              <th className="px-5 py-3 text-right font-medium">보유 포인트</th>
              <th className="px-5 py-3 text-right font-medium">담당중인 현장</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                <td className="px-5 py-3.5 font-medium">{u.name ?? "-"}</td>
                <td className="px-5 py-3.5 text-gray-600">{u.email ?? "-"}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-gold-deep">
                  {u.points.toLocaleString("ko-KR")}P
                </td>
                <td className="px-5 py-3.5 text-right text-gray-600">{managingMap.get(u.id) ?? "없음"}</td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-14 text-center text-stone">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h4 className="mb-3 text-[13.5px] font-semibold">충전 · 사용 내역</h4>
      <div className="mb-3 flex gap-2">
        {(["전체", "충전", "사용"] as const).map((t) => (
          <a
            key={t}
            href={`/admin/points?historyType=${t}${historyQ ? `&historyQ=${encodeURIComponent(historyQ)}` : ""}`}
            className={`rounded-full px-4 py-1.5 text-[13px] ${
              historyType === t ? "bg-ink text-white" : "border border-line text-gray-600"
            }`}
          >
            {t}
          </a>
        ))}
      </div>
      <form className="mb-3">
        <input type="hidden" name="historyType" value={historyType} />
        <input
          name="historyQ"
          defaultValue={historyQ}
          placeholder="이름, 이메일 또는 현장명으로 검색"
          className="w-72 rounded border border-line bg-white px-3.5 py-2 text-[13px] outline-none focus:border-gold"
        />
      </form>
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">일자</th>
              <th className="px-5 py-3 font-medium">이름</th>
              <th className="px-5 py-3 font-medium">구분</th>
              <th className="px-5 py-3 font-medium">내용</th>
              <th className="px-5 py-3 text-right font-medium">포인트</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((h) => (
              <tr key={h.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 text-gray-500">{new Date(h.created_at).toLocaleDateString("ko-KR")}</td>
                <td className="px-5 py-3 font-medium">{h.profiles?.name ?? "-"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      h.type === "충전" ? "bg-gold/15 text-gold-deep" : "bg-mist text-gray-600"
                    }`}
                  >
                    {h.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">{h.note ?? "-"}</td>
                <td
                  className={`px-5 py-3 text-right font-semibold ${
                    h.amount > 0 ? "text-gold-deep" : "text-red-500"
                  }`}
                >
                  {h.amount > 0 ? "+" : ""}
                  {h.amount.toLocaleString("ko-KR")}P
                </td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center text-stone">
                  내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
