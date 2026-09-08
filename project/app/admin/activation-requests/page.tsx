import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { VerificationDocLinks } from "@/components/admin/VerificationDocLinks";
import { ActivationRequestActions } from "@/components/admin/ActivationRequestActions";

export const dynamic = "force-dynamic";

export default async function ActivationRequestsPage({
  searchParams,
}: {
  searchParams: { filter?: "대기" | "승인" | "반려" };
}) {
  const supabase = createClient();
  const filter = searchParams.filter ?? "대기";

  type RequestRow = {
    id: string;
    listing_id: string | null;
    requester_id: string | null;
    work_agreement_path: string;
    business_card_path: string;
    status: "대기" | "승인" | "반려";
    rejection_reason: string | null;
    created_at: string;
  };

  const { data: requests } = await supabase
    .from("manager_activation_requests")
    .select("id, listing_id, requester_id, work_agreement_path, business_card_path, status, rejection_reason, created_at")
    .eq("status", filter)
    .order("created_at", { ascending: false })
    .returns<RequestRow[]>();

  // listings/profiles는 별도로 한 번에 조회해서 매칭합니다 (조인 모호성 방지 패턴 그대로 사용).
  const listingIds = [...new Set((requests ?? []).map((r) => r.listing_id).filter(Boolean))] as string[];
  const requesterIds = [...new Set((requests ?? []).map((r) => r.requester_id).filter(Boolean))] as string[];

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, address")
    .in("id", listingIds.length > 0 ? listingIds : ["00000000-0000-0000-0000-000000000000"])
    .returns<{ id: string; title: string; address: string | null }[]>();
  const listingMap = new Map((listings ?? []).map((l) => [l.id, l]));

  const { data: requesters } = await supabase
    .from("profiles")
    .select("id, name, email, phone")
    .in("id", requesterIds.length > 0 ? requesterIds : ["00000000-0000-0000-0000-000000000000"])
    .returns<{ id: string; name: string | null; email: string | null; phone: string | null }[]>();
  const requesterMap = new Map((requesters ?? []).map((r) => [r.id, r]));

  return (
    <div>
      <AdminPageHeader
        title="담당자 신청"
        description="주인없는 현장에 새로 담당자로 신청한 건을 서류 확인 후 승인/반려합니다."
      />

      <div className="mb-5 flex gap-2">
        {(["대기", "승인", "반려"] as const).map((s) => (
          <a
            key={s}
            href={`/admin/activation-requests?filter=${s}`}
            className={`rounded-full px-4 py-1.5 text-[13px] ${
              filter === s ? "bg-ink text-white" : "border border-line text-gray-600 hover:border-ink"
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      <div className="space-y-3.5">
        {(requests ?? []).map((r) => {
          const listing = r.listing_id ? listingMap.get(r.listing_id) : null;
          const requester = r.requester_id ? requesterMap.get(r.requester_id) : null;
          return (
            <div key={r.id} className="rounded-lg border border-line bg-white p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold">{listing?.title ?? "(삭제된 현장)"}</p>
                  <p className="text-[12px] text-stone">{listing?.address ?? ""}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    r.status === "대기"
                      ? "border border-line text-gray-500"
                      : r.status === "반려"
                      ? "bg-mist text-gray-500"
                      : "bg-gold/15 text-gold-deep"
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-4 rounded bg-mist/50 px-4 py-3 text-[12.5px]">
                <div>
                  <p className="mb-0.5 text-stone">신청자</p>
                  <p className="font-medium">{requester?.name ?? "-"}</p>
                </div>
                <div>
                  <p className="mb-0.5 text-stone">연락처 / 이메일</p>
                  <p className="font-medium">
                    {requester?.phone ?? "-"} · {requester?.email ?? "-"}
                  </p>
                </div>
              </div>

              <div className="mb-3.5 flex items-center justify-between">
                <VerificationDocLinks
                  workAgreementPath={r.work_agreement_path}
                  businessCardPath={r.business_card_path}
                />
                <span className="text-[11.5px] text-gray-400">
                  신청일 {new Date(r.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>

              {r.rejection_reason && (
                <p className="mb-3 text-[12px] text-red-500">반려사유: {r.rejection_reason}</p>
              )}

              {r.status === "대기" && <ActivationRequestActions requestId={r.id} />}
            </div>
          );
        })}
        {(requests ?? []).length === 0 && (
          <div className="rounded-lg border border-line bg-white px-5 py-16 text-center text-stone">
            해당 상태의 신청 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
