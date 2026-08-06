import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type MyListingRow = {
    id: string;
    title: string;
    status: string;
    is_approved: boolean;
    rejection_reason: string | null;
    created_at: string;
  };

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, status, is_approved, rejection_reason, created_at")
    .eq("agency_id", user.id)
    .order("created_at", { ascending: false })
    .returns<MyListingRow[]>();

  return (
    <section className="mx-auto max-w-[900px] px-8 py-12">
      <div className="mb-8">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">내가 등록한 현장</h1>
        <p className="text-[13.5px] text-stone">등록한 현장의 승인 상태를 확인할 수 있습니다.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">분양명</th>
              <th className="px-5 py-3 font-medium">분양상태</th>
              <th className="px-5 py-3 font-medium">승인상태</th>
              <th className="px-5 py-3 font-medium">등록일</th>
            </tr>
          </thead>
          <tbody>
            {(listings ?? []).map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                <td className="px-5 py-3.5 font-medium">
                  <Link href={`/listing/${l.id}`} target="_blank" className="hover:text-gold-deep">
                    {l.title}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{l.status}</td>
                <td className="px-5 py-3.5">
                  {l.is_approved ? (
                    <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11.5px] font-semibold text-gold-deep">
                      승인완료
                    </span>
                  ) : l.rejection_reason ? (
                    <div>
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11.5px] font-semibold text-red-500">
                        반려
                      </span>
                      <p className="mt-1.5 max-w-[320px] text-[12px] leading-relaxed text-red-500">
                        사유: {l.rejection_reason}
                      </p>
                    </div>
                  ) : (
                    <span className="rounded-full bg-mist px-2.5 py-1 text-[11.5px] font-semibold text-gray-500">
                      승인대기
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-gray-500">{new Date(l.created_at).toLocaleDateString("ko-KR")}</td>
              </tr>
            ))}
            {(listings ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center text-stone">
                  아직 등록한 현장이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
