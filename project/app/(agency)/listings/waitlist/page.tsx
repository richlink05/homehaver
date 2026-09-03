import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MypageShell } from "@/components/mypage/MypageShell";

export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
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

  type WaitlistRow = {
    id: string;
    requested_at: string;
    listings: { id: string; title: string; status: string; agency_id: string | null } | null;
  };

  const { data: rows } = await supabase
    .from("listing_waitlist")
    .select("id, requested_at, listings(id, title, status, agency_id)")
    .eq("user_id", user.id)
    .order("requested_at", { ascending: true })
    .returns<WaitlistRow[]>();

  return (
    <MypageShell role={profile?.role} name={profile?.name} activeHref="/listings/waitlist">
      <div className="mb-8">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">대기중인 현장</h1>
        <p className="text-[13.5px] text-stone">
          이미 다른 담당자가 있어 대기자로 등록된 현장입니다. 담당자의 포인트가 소진되면 순서대로 인계됩니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">분양명</th>
              <th className="px-5 py-3 font-medium">분양상태</th>
              <th className="px-5 py-3 font-medium">신청일</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
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
                <td className="px-5 py-3.5 text-gray-600">{r.listings?.status ?? "-"}</td>
                <td className="px-5 py-3.5 text-gray-500">
                  {new Date(r.requested_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-16 text-center text-stone">
                  대기중인 현장이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </MypageShell>
  );
}
