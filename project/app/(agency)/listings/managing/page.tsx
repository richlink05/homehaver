import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingStatusActions } from "@/components/listing/ListingStatusActions";

export const dynamic = "force-dynamic";

export default async function ManagingListingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type ManagingRow = {
    id: string;
    title: string;
    status: string;
    tenure_start: string | null;
    listing_waitlist: { id: string }[];
  };

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, status, tenure_start, listing_waitlist(id)")
    .eq("agency_id", user.id)
    .order("tenure_start", { ascending: false })
    .returns<ManagingRow[]>();

  return (
    <section className="mx-auto max-w-[900px] px-8 py-12">
      <div className="mb-8">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">내가 담당중인 현장</h1>
        <p className="text-[13.5px] text-stone">
          현재 내 포인트로 노출중인 현장입니다. 한 번에 하나의 현장만 담당할 수 있습니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">분양명</th>
              <th className="px-5 py-3 font-medium">분양상태</th>
              <th className="px-5 py-3 font-medium">담당 시작일</th>
              <th className="px-5 py-3 font-medium">대기자</th>
              <th className="px-5 py-3 text-right font-medium">작업</th>
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
                <td className="px-5 py-3.5 text-gray-500">
                  {l.tenure_start ? new Date(l.tenure_start).toLocaleDateString("ko-KR") : "-"}
                </td>
                <td className="px-5 py-3.5">
                  {l.listing_waitlist?.length > 0 ? (
                    <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11.5px] font-semibold text-gold-deep">
                      {l.listing_waitlist.length}명 대기중
                    </span>
                  ) : (
                    <span className="text-gray-400">없음</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <ListingStatusActions listingId={l.id} action="stop_managing" />
                </td>
              </tr>
            ))}
            {(listings ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-stone">
                  현재 담당하고 있는 현장이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
