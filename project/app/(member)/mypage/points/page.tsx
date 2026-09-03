import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChargeModal } from "@/components/points/ChargeModal";
import { MypageShell } from "@/components/mypage/MypageShell";

export const dynamic = "force-dynamic";

export default async function PointsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, points")
    .eq("id", user.id)
    .single<{ name: string | null; role: "user" | "agency" | "admin"; points: number }>();

  type PointTxRow = {
    id: string;
    type: "충전" | "사용" | "환불";
    amount: number;
    note: string | null;
    balance_after: number;
    created_at: string;
  };

  const { data: history } = await supabase
    .from("point_transactions")
    .select("id, type, amount, note, balance_after, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<PointTxRow[]>();

  return (
    <MypageShell role={profile?.role} name={profile?.name} activeHref="/mypage/points">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="mb-1.5 font-serif text-[22px] font-semibold">포인트관리</h1>
          <p className="text-[13.5px] text-stone">현장 노출에 사용하는 포인트를 충전하고 내역을 확인합니다.</p>
        </div>
        <ChargeModal />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">현재 보유 포인트</p>
          <p className="font-serif text-[26px] font-semibold text-gold-deep">
            {(profile?.points ?? 0).toLocaleString("ko-KR")}P
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">하루 노출 비용</p>
          <p className="font-serif text-[26px] font-semibold">15,000P</p>
        </div>
      </div>

      <h4 className="mb-3.5 text-[14px] font-semibold">포인트 사용 · 충전 내역</h4>
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">일자</th>
              <th className="px-5 py-3 font-medium">구분</th>
              <th className="px-5 py-3 font-medium">내용</th>
              <th className="px-5 py-3 text-right font-medium">포인트</th>
              <th className="px-5 py-3 text-right font-medium">잔액</th>
            </tr>
          </thead>
          <tbody>
            {(history ?? []).map((h) => (
              <tr key={h.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 text-gray-500">{new Date(h.created_at).toLocaleDateString("ko-KR")}</td>
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
                <td className="px-5 py-3 text-right text-gray-500">{h.balance_after.toLocaleString("ko-KR")}P</td>
              </tr>
            ))}
            {(history ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-stone">
                  포인트 사용/충전 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </MypageShell>
  );
}
