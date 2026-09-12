import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { FavoriteCount } from "@/components/admin/FavoriteCount";
import { BackfillGeocodeButton } from "@/components/admin/BackfillGeocodeButton";

export const dynamic = "force-dynamic";

export default async function AdStatusPage() {
  const supabase = createClient();

  type ListingRow = {
    id: string;
    title: string;
    address: string | null;
    agency_id: string | null;
  };

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, address, agency_id")
    .eq("is_approved", true)
    .order("title")
    .returns<ListingRow[]>();

  // listings→profiles는 외래키가 2개(agency_id/registrant_id)라 조인이 모호해질 수 있어
  // 현재 담당자 프로필은 따로 한 번에 조회해서 매칭합니다.
  const managerIds = [...new Set((listings ?? []).map((l) => l.agency_id).filter(Boolean))] as string[];
  const { data: managers } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", managerIds.length > 0 ? managerIds : ["00000000-0000-0000-0000-000000000000"])
    .returns<{ id: string; name: string | null; email: string | null }[]>();
  const managerMap = new Map((managers ?? []).map((m) => [m.id, m]));

  // 즐겨찾기 목록은 favorites→profiles가 외래키 하나뿐이라 바로 조인해도 안전합니다.
  type FavoriteRow = {
    id: string;
    listing_id: string;
    created_at: string;
    profiles: { name: string | null; email: string | null } | null;
  };
  const listingIds = (listings ?? []).map((l) => l.id);
  const { data: favoriteRows } = await supabase
    .from("favorites")
    .select("id, listing_id, created_at, profiles(name, email)")
    .in("listing_id", listingIds.length > 0 ? listingIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: true })
    .returns<FavoriteRow[]>();

  const favoritesByListing = new Map<string, { name: string | null; email: string | null; created_at: string }[]>();
  (favoriteRows ?? []).forEach((f) => {
    const arr = favoritesByListing.get(f.listing_id) ?? [];
    arr.push({ name: f.profiles?.name ?? null, email: f.profiles?.email ?? null, created_at: f.created_at });
    favoritesByListing.set(f.listing_id, arr);
  });

  return (
    <div>
      <AdminPageHeader
        title="광고내역"
        description="승인된 현장별 현재 담당자와 즐겨찾기 현황을 확인합니다. 담당자가 없는 현장은 영업 대상입니다."
      />

      <BackfillGeocodeButton />

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">현장명</th>
              <th className="px-5 py-3 font-medium">주소</th>
              <th className="px-5 py-3 font-medium">현재 담당자</th>
              <th className="px-5 py-3 font-medium">즐겨찾기 수</th>
            </tr>
          </thead>
          <tbody>
            {(listings ?? []).map((l) => {
              const manager = l.agency_id ? managerMap.get(l.agency_id) : null;
              const favorites = favoritesByListing.get(l.id) ?? [];
              return (
                <tr key={l.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                  <td className="px-5 py-3.5 font-medium">{l.title}</td>
                  <td className="px-5 py-3.5 text-gray-500">{l.address ?? "-"}</td>
                  <td className="px-5 py-3.5">
                    {manager ? (
                      <span className="text-gray-700">
                        {manager.name ?? "-"} <span className="text-gray-400">({manager.email ?? "-"})</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11.5px] font-semibold text-red-500">
                        담당자 없음 · 영업 대상
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <FavoriteCount favorites={favorites} />
                  </td>
                </tr>
              );
            })}
            {(listings ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center text-stone">
                  승인된 현장이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
