import { createClient } from "@/lib/supabase/server";
import { InquiryStatusToggle } from "@/components/agency/InquiryStatusToggle";

export default async function AgencyInquiriesPage({
  searchParams,
}: {
  searchParams: { filter?: "pending" | "answered" };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const filter = searchParams.filter ?? "pending";

  // 내가 등록(담당)한 현장에 접수된 문의만 조회합니다.
  let query = supabase
    .from("inquiries")
    .select("id, name, phone, message, status, created_at, listings!inner(id, title, agency_id)")
    .eq("listings.agency_id", user?.id)
    .order("created_at", { ascending: false });

  query = filter === "pending" ? query.neq("status", "응답완료") : query.eq("status", "응답완료");

  const { data: inquiries } = await query;

  return (
    <section className="mx-auto max-w-[1100px] px-8 py-12">
      <div className="mb-7">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">문의관리</h1>
        <p className="text-[13px] text-stone">내가 담당하는 현장으로 접수된 고객 상담 신청입니다.</p>
      </div>

      <div className="mb-5 flex gap-2">
        <a
          href="/inquiries?filter=pending"
          className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
            filter === "pending" ? "bg-ink text-white" : "border border-line text-gray-600 hover:border-ink"
          }`}
        >
          대기중
        </a>
        <a
          href="/inquiries?filter=answered"
          className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
            filter === "answered" ? "bg-ink text-white" : "border border-line text-gray-600 hover:border-ink"
          }`}
        >
          응답완료
        </a>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">현장명</th>
              <th className="px-5 py-3 font-medium">고객명</th>
              <th className="px-5 py-3 font-medium">연락처</th>
              <th className="px-5 py-3 font-medium">문의내용</th>
              <th className="px-5 py-3 font-medium">신청일</th>
              <th className="px-5 py-3 font-medium text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {(inquiries ?? []).map((q: any) => (
              <tr key={q.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                <td className="px-5 py-3.5 font-medium">
                  <a href={`/listing/${q.listings.id}`} className="hover:text-gold-deep">
                    {q.listings.title}
                  </a>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{q.name}</td>
                <td className="px-5 py-3.5">
                  <a href={`tel:${q.phone.replace(/-/g, "")}`} className="font-semibold text-gold-deep">
                    {q.phone}
                  </a>
                </td>
                <td className="max-w-[220px] truncate px-5 py-3.5 text-gray-600">{q.message || "-"}</td>
                <td className="px-5 py-3.5 text-gray-500">{new Date(q.created_at).toLocaleDateString("ko-KR")}</td>
                <td className="px-5 py-3.5 text-right">
                  <InquiryStatusToggle inquiryId={q.id} status={q.status} />
                </td>
              </tr>
            ))}
            {(inquiries ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-stone">
                  담당 현장으로 접수된 상담 신청이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
