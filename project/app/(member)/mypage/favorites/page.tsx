import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listing/ListingCard";
import { MypageShell } from "@/components/mypage/MypageShell";

export const dynamic = "force-dynamic";

export default async function MyFavoritesPage() {
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

  const { data: favorites } = await supabase
    .from("favorites")
    .select("listings(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (favorites ?? []).map((f: any) => f.listings).filter(Boolean);

  return (
    <MypageShell role={profile?.role} name={profile?.name} activeHref="/mypage/favorites">
      <div className="mb-6">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">즐겨찾기</h1>
        <p className="text-[13.5px] text-stone">
          즐겨찾기한 현장의 담당자가 이탈하면, 등록하신 연락처로 알림을 보내드릴 예정입니다.
        </p>
      </div>

      {listings.length > 0 ? (
        <div className="grid grid-cols-3 gap-5">
          {listings.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone">
          아직 즐겨찾기한 현장이 없습니다. 매물 상세페이지에서 즐겨찾기 버튼을 눌러보세요.
        </p>
      )}
    </MypageShell>
  );
}
