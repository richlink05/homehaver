import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader, StatusBadge } from "@/components/admin/AdminUI";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const supabase = createClient();

  type AdminInquiryRow = {
    id: string;
    name: string;
    phone: string;
    message: string | null;
    status: "대기" | "응답완료";
    created_at: string;
    listings: { id: string; title: string } | null;
  };

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("id, name, phone, message, status, created_at, listings(id, title)")
    .order("created_at", { ascending: false })
    .returns<AdminInquiryRow[]>();

  return (
    <div>
      <AdminPageHeader title="상담문의" description="전체 현장에 접수된 상담신청 내역을 확인합니다." />

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">현장명</th>
              <th className="px-5 py-3 font-medium">고객명</th>
              <th className="px-5 py-3 font-medium">연락처</th>
              <th className="px-5 py-3 font-medium">문의내용</th>
              <th className="px-5 py-3 font-medium">상태</th>
              <th className="px-5 py-3 font-medium">신청일</th>
            </tr>
          </thead>
          <tbody>
            {(inquiries ?? []).map((q) => (
              <tr key={q.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                <td className="px-5 py-3.5 font-medium">{q.listings?.title ?? "(삭제된 현장)"}</td>
                <td className="px-5 py-3.5 text-gray-600">{q.name}</td>
                <td className="px-5 py-3.5 text-gray-600">{q.phone}</td>
                <td className="max-w-[260px] px-5 py-3.5 text-gray-600">
                  <p className="truncate">{q.message || "-"}</p>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge value={q.status} />
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  {new Date(q.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
            {(inquiries ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-stone">
                  접수된 상담신청이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
