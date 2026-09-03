import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listing/ListingCard";
import { MypageShell } from "@/components/mypage/MypageShell";

export const dynamic = "force-dynamic";

export default async function MyPage() {
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

  const isAgency = profile?.role === "agency";

  const { data: favorites } = isAgency
    ? { data: null }
    : await supabase.from("favorites").select("listings(*)").eq("user_id", user.id).limit(9);

  return (
    <MypageShell role={profile?.role} name={profile?.name} activeHref={isAgency ? "/listings" : "/mypage/favorites"}>
      {isAgency ? (
        <>
          <h2 className="mb-3 font-serif text-[22px] font-semibold">환영합니다, {profile?.name} 님</h2>
          <p className="text-sm text-stone">
            왼쪽 메뉴에서 <b className="text-ink">내가 등록한 현장</b>의 승인 상태를 확인하거나,{" "}
            <b className="text-ink">상담문의</b>를 확인하실 수 있습니다.
          </p>
        </>
      ) : (
        <>
          <h2 className="mb-6 font-serif text-[22px] font-semibold">찜한 분양</h2>
          {favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-3 gap-5">
              {favorites.map((f: any) => (
                <ListingCard key={f.listings.id} listing={f.listings} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone">아직 찜한 분양이 없습니다. 마음에 드는 분양을 찜해보세요.</p>
          )}
        </>
      )}
    </MypageShell>
  );
}
