import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listing/ListingCard";

const NAV_ITEMS = [
  { label: "찜한 분양", href: "/mypage/favorites" },
  { label: "최근 본 현장", href: "/mypage/recent" },
  { label: "상담 신청 내역", href: "/mypage/inquiries" },
  { label: "내가 쓴 후기", href: "/mypage/reviews" },
  { label: "프로필 설정", href: "/mypage/profile" },
];

export default async function MyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user?.id)
    .single();

  const { data: favorites } = await supabase
    .from("favorites")
    .select("listings(*)")
    .eq("user_id", user?.id)
    .limit(9);

  return (
    <section className="mx-auto grid max-w-[1100px] grid-cols-[220px_1fr] gap-12 px-8 py-12">
      <aside className="border-r border-line pr-6">
        <div className="mb-8">
          <div className="mb-3 h-14 w-14 rounded-full bg-gradient-to-br from-gold-soft to-gold" />
          <p className="text-[16px] font-semibold leading-tight">{profile?.name ?? "회원"} 님</p>
          <p className="text-xs text-gold-deep">{profile?.role === "agency" ? "분양관계자" : "일반회원"}</p>
        </div>
        <nav>
          {NAV_ITEMS.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              className={`block border-b border-line py-2.5 text-sm hover:text-gold-deep ${
                i === 0 ? "font-semibold text-gold-deep" : "text-gray-600"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div>
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
      </div>
    </section>
  );
}
