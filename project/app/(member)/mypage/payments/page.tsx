import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MypageShell } from "@/components/mypage/MypageShell";
import { EXPOSURE_DAILY_PRICE, formatKst, formatRemaining, formatWon } from "@/lib/exposure";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  kind: "new" | "extend";
  days: number;
  amount: number;
  status: "결제대기" | "결제완료" | "결제만료" | "종료" | "환불";
  pay_deadline: string | null;
  paid_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  refunded_days: number;
  refund_amount: number;
  refund_status: "환불대기" | "환불완료" | null;
  created_at: string;
  listings: { id: string; title: string } | null;
};

const STATUS_STYLE: Record<string, string> = {
  결제대기: "bg-gold/15 text-gold-deep",
  결제완료: "bg-ink text-white",
  종료: "bg-mist text-gray-600",
  환불: "bg-mist text-gray-600",
  결제만료: "bg-red-50 text-red-500",
};

export default async function PaymentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single<{ name: string | null; role: "user" | "agency" | "admin" }>();

  const { data: orders } = await supabase
    .from("exposure_orders")
    .select(
      "id, kind, days, amount, status, pay_deadline, paid_at, starts_at, ends_at, refunded_days, refund_amount, refund_status, created_at, listings(id, title)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<OrderRow[]>();

  const waiting = (orders ?? []).filter((o) => o.status === "결제대기");
  const now = Date.now();

  return (
    <MypageShell role={profile?.role} name={profile?.name} activeHref="/mypage/payments">
      <div className="mb-7">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">결제내역</h1>
        <p className="text-[13.5px] text-stone">
          현장 노출은 기간(1·3·7·10일)을 골라 결제하는 방식입니다. 하루 {formatWon(EXPOSURE_DAILY_PRICE)}이며, 노출은
          매일 오전 6시에 시작·종료됩니다.
        </p>
      </div>

      {waiting.length > 0 && (
        <div className="mb-8 space-y-3">
          {waiting.map((o) => (
            <div key={o.id} className="rounded-lg border-2 border-gold bg-gold/5 p-5">
              <p className="mb-1 text-[14px] font-semibold">
                결제가 필요합니다 · {o.listings?.title ?? "(삭제된 현장)"}
              </p>
              <p className="text-[13px] text-gray-700">
                {o.kind === "extend" ? "연장" : "신규 노출"} {o.days}일 · <b>{formatWon(o.amount)}</b> ·{" "}
                {formatKst(o.pay_deadline)}까지 ({formatRemaining(o.pay_deadline, now)} 남음)
              </p>
              <p className="mt-2 text-[12px] text-stone">
                기한 안에 결제하지 않으면 {o.kind === "extend" ? "연장이 취소됩니다" : "선점이 취소되고 다음 순번으로 넘어갑니다"}.
                카드/계좌 결제(토스)는 준비중이며, 현재는 관리자가 결제 확인을 처리합니다. 문의: 1544-0892
              </p>
            </div>
          ))}
        </div>
      )}

      <h4 className="mb-3.5 text-[14px] font-semibold">주문 · 결제 내역</h4>
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">신청일</th>
              <th className="px-5 py-3 font-medium">분양명</th>
              <th className="px-5 py-3 font-medium">구분</th>
              <th className="px-5 py-3 font-medium">노출 기간</th>
              <th className="px-5 py-3 text-right font-medium">금액</th>
              <th className="px-5 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="border-b border-line align-top last:border-0">
                <td className="px-5 py-3.5 text-gray-500">{new Date(o.created_at).toLocaleDateString("ko-KR")}</td>
                <td className="px-5 py-3.5 font-medium">
                  {o.listings ? (
                    <Link href={`/listing/${o.listings.id}`} target="_blank" className="hover:text-gold-deep">
                      {o.listings.title}
                    </Link>
                  ) : (
                    "(삭제된 현장)"
                  )}
                </td>
                <td className="px-5 py-3.5 text-gray-600">
                  {o.kind === "extend" ? "연장" : "신규"} {o.days}일
                </td>
                <td className="px-5 py-3.5 text-[12.5px] text-gray-600">
                  {o.starts_at ? `${formatKst(o.starts_at)} ~ ${formatKst(o.ends_at)}` : "-"}
                </td>
                <td className="px-5 py-3.5 text-right font-semibold">{formatWon(o.amount)}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${STATUS_STYLE[o.status] ?? ""}`}
                  >
                    {o.status}
                  </span>
                  {o.refunded_days > 0 && (
                    <p className="mt-1 text-[11.5px] text-gray-500">
                      환불 {o.refunded_days}일 {formatWon(o.refund_amount)} ({o.refund_status ?? "-"})
                    </p>
                  )}
                </td>
              </tr>
            ))}
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-stone">
                  결제 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </MypageShell>
  );
}
