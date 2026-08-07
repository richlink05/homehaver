import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listing/ListingCard";

export const dynamic = "force-dynamic";


const NAV_ITEMS_USER = [
  { label: "찜한 분양", href: "/mypage/favorites" },
  { label: "최근 본 현장", href: "/mypage/recent" },
  { label: "상담 신청 내역", href: "/mypage/inquiries" },
  { label: "내가 쓴 후기", href: "/mypage/reviews" },
  { label: "프로필 설정", href: "/mypage/profile" },
];

const NAV_ITEMS_AGENCY = [
  { label: "내가 등록한 현장", href: "/listings" },
  { label: "내가 담당중인 현장", href: "/listings/managing" },
  { label: "대기중인 현장", href: "/listings/waitlist" },
  { label: "상담문의", href: "/inquiries" },
  { label: "포인트관리", href: "/mypage/points" },
  { label: "프로필 설정", href: "/mypage/profile" },
];

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
  const navItems = isAgency ? NAV_ITEMS_AGENCY : NAV_ITEMS_USER;

  const { data: favorites } = isAgency
    ? { data: null }
    : await supabase.from("favorites").select("listings(*)").eq("user_id", user.id).limit(9);

  return (
    <section className="mx-auto grid max-w-[1100px] grid-cols-[220px_1fr] gap-12 px-8 py-12">
      <aside className="border-r border-line pr-6">
        <div className="mb-8">
          <div className="mb-3 h-14 w-14 rounded-full bg-gradient-to-br from-gold-soft to-gold" />
          <p className="text-[16px] font-semibold leading-tight">{profile?.name ?? "회원"} 님</p>
          <p className="text-xs text-gold-deep">{isAgency ? "분양담당자" : "일반회원"}</p>
        </div>
        <nav>
          {navItems.map((item, i) => (
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
      </div>
    </section>
  );
}
