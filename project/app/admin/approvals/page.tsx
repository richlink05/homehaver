import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader, StatusBadge } from "@/components/admin/AdminUI";
import { ApprovalActions } from "@/components/admin/ApprovalActions";

export const dynamic = "force-dynamic";


export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: { filter?: "pending" | "approved" | "rejected" };
}) {
  const supabase = createClient();
  // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
  (supabase.rpc as any)("process_daily_deductions").then();
  const filter = searchParams.filter ?? "pending";

  type ApprovalListingRow = {
    id: string;
    title: string;
    type: string;
    status: string;
    is_approved: boolean;
    rejection_reason: string | null;
    created_at: string;
    registrant_id: string | null;
  };

  let query = supabase
    .from("listings")
    .select("id, title, type, status, is_approved, rejection_reason, created_at, registrant_id")
    .order("created_at", { ascending: false });

  if (filter === "pending") query = query.eq("is_approved", false).is("rejection_reason", null);
  if (filter === "approved") query = query.eq("is_approved", true);
  if (filter === "rejected") query = query.eq("is_approved", false).not("rejection_reason", "is", null);

  const { data: listings } = await query.returns<ApprovalListingRow[]>();

  // listings에는 profiles로 연결된 외래키가 2개(agency_id, registrant_id)라 조인 시 모호해질 수 있어,
  // 등록자 정보는 별도로 한 번에 조회해서 매칭합니다.
  const registrantIds = [...new Set((listings ?? []).map((l) => l.registrant_id).filter(Boolean))] as string[];
  const { data: registrants } = await supabase
    .from("profiles")
    .select("id, name, company_name")
    .in("id", registrantIds.length > 0 ? registrantIds : ["00000000-0000-0000-0000-000000000000"])
    .returns<{ id: string; name: string | null; company_name: string | null }[]>();
  const registrantMap = new Map((registrants ?? []).map((r) => [r.id, r]));

  return (
    <div>
      <AdminPageHeader title="분양 승인" description="분양관계자가 등록한 매물을 검토하고 승인합니다." />

      <div className="mb-5 flex gap-2">
        <FilterTab href="/admin/approvals?filter=pending" active={filter === "pending"} label="승인 대기" />
        <FilterTab href="/admin/approvals?filter=approved" active={filter === "approved"} label="승인 완료" />
        <FilterTab href="/admin/approvals?filter=rejected" active={filter === "rejected"} label="반려" />
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">분양명</th>
              <th className="px-5 py-3 font-medium">유형</th>
              <th className="px-5 py-3 font-medium">등록자</th>
              <th className="px-5 py-3 font-medium">상태</th>
              <th className="px-5 py-3 font-medium">등록일</th>
              <th className="px-5 py-3 font-medium text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {(listings ?? []).map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                <td className="px-5 py-3.5 font-medium">
                  <Link
                    href={`/listing/${l.id}`}
                    target="_blank"
                    className="text-gold-deep underline decoration-gold-soft underline-offset-2 hover:text-ink"
                  >
                    {l.title} ↗
                  </Link>
                  {l.rejection_reason && (
                    <p className="mt-1 max-w-[280px] text-[11.5px] leading-relaxed text-red-500">
                      반려사유: {l.rejection_reason}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-gray-600">{l.type}</td>
                <td className="px-5 py-3.5 text-gray-600">
                  {registrantMap.get(l.registrant_id ?? "")?.company_name ??
                    registrantMap.get(l.registrant_id ?? "")?.name ??
                    "-"}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge value={l.status} />
                </td>
                <td className="px-5 py-3.5 text-gray-500">{new Date(l.created_at).toLocaleDateString("ko-KR")}</td>
                <td className="px-5 py-3.5 text-right">
                  <ApprovalActions listingId={l.id} approved={l.is_approved} />
                </td>
              </tr>
            ))}
            {(listings ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-stone">
                  표시할 항목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterTab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
        active ? "bg-ink text-white" : "border border-line text-gray-600 hover:border-ink"
      }`}
    >
      {label}
    </a>
  );
}
