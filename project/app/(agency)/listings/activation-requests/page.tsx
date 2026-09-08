import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MypageShell } from "@/components/mypage/MypageShell";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  대기: "bg-mist text-gray-600",
  승인: "bg-gold/15 text-gold-deep",
  반려: "bg-red-50 text-red-500",
};

export default async function MyActivationRequestsPage() {
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

  type RequestRow = {
    id: string;
    status: "대기" | "승인" | "반려";
    rejection_reason: string | null;
    created_at: string;
    listings: { id: string; title: string } | null;
  };

  const { data: requests } = await supabase
    .from("manager_activation_requests")
    .select("id, status, rejection_reason, created_at, listings(id, title)")
    .eq("requester_id", user.id)
    .order("created_at", { ascending: false })
    .returns<RequestRow[]>();

  return (
    <MypageShell role={profile?.role} name={profile?.name} activeHref="/listings/activation-requests">
      <div className="mb-8">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">담당자 신청내역</h1>
        <p className="text-[13.5px] text-stone">
          주인없는 현장에 담당자로 신청한 내역과 처리 상태를 확인할 수 있습니다.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">분양명</th>
              <th className="px-5 py-3 font-medium">상태</th>
              <th className="px-5 py-3 font-medium">신청일</th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                <td className="px-5 py-3.5 font-medium">
                  {r.listings ? (
                    <Link href={`/listing/${r.listings.id}`} target="_blank" className="hover:text-gold-deep">
                      {r.listings.title}
                    </Link>
                  ) : (
                    "(삭제된 현장)"
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${STATUS_STYLE[r.status]}`}>
                    {r.status}
                  </span>
                  {r.status === "반려" && r.rejection_reason && (
                    <p className="mt-1 text-[11.5px] text-red-500">사유: {r.rejection_reason}</p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  {new Date(r.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
            {(requests ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-16 text-center text-stone">
                  신청한 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </MypageShell>
  );
}
