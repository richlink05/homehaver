"use client";

import { useState } from "react";

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
  { label: "즐겨찾기", href: "/mypage/favorites" },
  { label: "담당자 신청내역", href: "/listings/activation-requests" },
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
  // 모바일(860px 이하)에서는 기본적으로 접혀있고, 버튼을 눌러야 펼쳐집니다.
  // 데스크탑에서는 이 상태와 무관하게 항상 보이도록 CSS로 처리합니다.
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = navItems.find((item) => item.href === activeHref)?.label ?? "메뉴";

  return (
    <section className="mx-auto max-w-[1400px] px-8 py-12">
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="mb-4 flex w-full items-center justify-between rounded border border-line px-4 py-3 text-[13.5px] font-medium min-[861px]:hidden"
      >
        <span className="flex items-center gap-2">
          {/* 햄버거 아이콘 */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {activeLabel}
        </span>
        <span className="text-gray-400">{mobileOpen ? "닫기 ▲" : "메뉴 ▼"}</span>
      </button>

      <div className="grid grid-cols-1 gap-12 min-[861px]:grid-cols-[220px_1fr]">
        <aside className={`border-line pr-6 min-[861px]:block min-[861px]:border-r ${mobileOpen ? "block" : "hidden"}`}>
          <div className="mb-8 min-[861px]:block hidden">
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
      </div>
    </section>
  );
}
