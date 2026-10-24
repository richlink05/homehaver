import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { OrderActions } from "@/components/admin/OrderActions";
import { formatKst, formatWon } from "@/lib/exposure";

export const dynamic = "force-dynamic";

type Filter = "결제대기" | "환불대기" | "결제완료" | "전체";

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
  listings: { title: string } | null;
  profiles: { name: string | null; email: string | null; phone: string | null } | null;
};

export default async function AdminPaymentsPage({ searchParams }: { searchParams: { filter?: Filter } }) {
  const supabase = createClient();
  const filter = searchParams.filter ?? "결제대기";

  let query = supabase
    .from("exposure_orders")
    .select(
      "id, kind, days, amount, status, pay_deadline, paid_at, starts_at, ends_at, refunded_days, refund_amount, refund_status, created_at, listings(title), profiles(name, email, phone)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter === "결제대기") query = query.eq("status", "결제대기");
  if (filter === "결제완료") query = query.eq("status", "결제완료");
  if (filter === "환불대기") query = query.eq("refund_status", "환불대기");
  const { data: orders } = await query.returns<OrderRow[]>();

  // 요약: 누적 결제금액 / 환불금액 (전체 기준)
  const paidRes = await supabase
    .from("exposure_orders")
    .select("amount, refund_amount, refund_status")
    .not("paid_at", "is", null);
  const allPaid = (paidRes.data ?? []) as { amount: number; refund_amount: number; refund_status: string | null }[];
  const totalPaid = allPaid.reduce((s, o) => s + o.amount, 0);
  const totalRefund = allPaid.reduce((s, o) => s + o.refund_amount, 0);
  const pendingRefund = allPaid
    .filter((o) => o.refund_status === "환불대기")
    .reduce((s, o) => s + o.refund_amount, 0);

  return (
    <div>
      <AdminPageHeader
        title="결제관리"
        description="현장 노출 결제(1·3·7·10일)를 확인하고 환불을 처리합니다. 토스 결제 연동 전까지는 입금 확인 후 '결제 확인'을 눌러주세요."
      />

      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">누적 결제금액</p>
          <p className="font-serif text-[24px] font-semibold text-gold-deep">{formatWon(totalPaid)}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">환불 접수 금액 (누적)</p>
          <p className="font-serif text-[24px] font-semibold">{formatWon(totalRefund)}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="mb-1.5 text-[12px] text-stone">환불 처리 대기</p>
          <p className="font-serif text-[24px] font-semibold text-red-500">{formatWon(pendingRefund)}</p>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        {(["결제대기", "환불대기", "결제완료", "전체"] as const).map((s) => (
          <a
            key={s}
            href={`/admin/payments?filter=${s}`}
            className={`rounded-full px-4 py-1.5 text-[13px] ${
              filter === s ? "bg-ink text-white" : "border border-line text-gray-600 hover:border-ink"
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[900px] text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">신청일</th>
              <th className="px-5 py-3 font-medium">담당자</th>
              <th className="px-5 py-3 font-medium">현장</th>
              <th className="px-5 py-3 font-medium">구분</th>
              <th className="px-5 py-3 text-right font-medium">금액</th>
              <th className="px-5 py-3 font-medium">노출 기간 / 결제기한</th>
              <th className="px-5 py-3 font-medium">상태</th>
              <th className="px-5 py-3 text-right font-medium">처리</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="border-b border-line align-top last:border-0">
                <td className="px-5 py-3.5 text-gray-500">{new Date(o.created_at).toLocaleDateString("ko-KR")}</td>
                <td className="px-5 py-3.5">
                  <p className="font-medium">{o.profiles?.name ?? "-"}</p>
                  <p className="text-[11.5px] text-stone">{o.profiles?.phone ?? o.profiles?.email ?? ""}</p>
                </td>
                <td className="px-5 py-3.5">{o.listings?.title ?? "(삭제된 현장)"}</td>
                <td className="px-5 py-3.5 text-gray-600">
                  {o.kind === "extend" ? "연장" : "신규"} {o.days}일
                </td>
                <td className="px-5 py-3.5 text-right font-semibold">{formatWon(o.amount)}</td>
                <td className="px-5 py-3.5 text-[12.5px] text-gray-600">
                  {o.status === "결제대기"
                    ? `기한 ${formatKst(o.pay_deadline)}`
                    : o.starts_at
                    ? `${formatKst(o.starts_at)} ~ ${formatKst(o.ends_at)}`
                    : "-"}
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full bg-mist px-2.5 py-1 text-[11.5px] font-semibold text-gray-600">
                    {o.status}
                  </span>
                  {o.refunded_days > 0 && (
                    <p className="mt-1 text-[11.5px] text-red-500">
                      환불 {o.refunded_days}일 {formatWon(o.refund_amount)} · {o.refund_status}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {o.status === "결제대기" && <OrderActions orderId={o.id} action="confirm_payment" />}
                  {o.refund_status === "환불대기" && <OrderActions orderId={o.id} action="refund_done" />}
                </td>
              </tr>
            ))}
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center text-stone">
                  해당하는 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
