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
  { label: "공지사항", href: "/mypage/notices" },
  { label: "프로필 설정", href: "/mypage/profile" },
];

export function MypageShell({
  role,
  name,
  activeHref,
  children,
}: {
  role: "user" | "agency" | "admin" | null | undefined;
  name: string | null | undefined;
  activeHref: string;
  children: React.ReactNode;
}) {
  const isAgency = role === "agency";
  const navItems = isAgency ? NAV_ITEMS_AGENCY : NAV_ITEMS_USER;

  return (
    <section className="mx-auto grid max-w-[1100px] grid-cols-[220px_1fr] gap-12 px-8 py-12">
      <aside className="border-r border-line pr-6">
        <div className="mb-8">
          <div className="mb-3 h-14 w-14 rounded-full bg-gradient-to-br from-gold-soft to-gold" />
          <p className="text-[16px] font-semibold leading-tight">{name ?? "회원"} 님</p>
          <p className="text-xs text-gold-deep">{isAgency ? "분양담당자" : "일반회원"}</p>
        </div>
        <nav>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`block border-b border-line py-2.5 text-sm hover:text-gold-deep ${
                item.href === activeHref ? "font-semibold text-gold-deep" : "text-gray-600"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div>{children}</div>
    </section>
  );
}
