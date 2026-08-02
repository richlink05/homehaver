import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RichLink — 대한민국 분양의 모든 정보를 연결하다",
  description: "대한민국 분양 전문 검색 플랫폼 RichLink",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-ink">
        <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between px-8 py-4.5">
            <Link href="/" className="font-serif text-xl font-semibold">
              Rich<span className="text-gold">Link</span>
            </Link>
            <nav className="flex items-center gap-7 text-sm">
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
              <Link href="/mypage">마이페이지</Link>
              <Link
                href="/listings/new"
                className="rounded-sm border border-ink px-4.5 py-2 text-[13px] transition-colors hover:bg-ink hover:text-white"
              >
                분양등록
              </Link>
            </nav>
          </div>
        </header>
        {children}

        <footer className="border-t border-line bg-mist">
          <div className="mx-auto max-w-[1240px] px-8 py-11">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-5">
              <div className="font-serif text-lg font-semibold">
                Rich<span className="text-gold">Link</span>
              </div>
              <div className="flex gap-4 text-[12.5px] text-gray-500">
                <Link href="/search" className="hover:text-gold-deep">
                  전체 분양 검색
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] leading-relaxed text-stone">
              <span>
                <b className="font-semibold text-gray-600">(주)리치디앤씨</b>
              </span>
              <span>대표 김리치</span>
              <span>사업자등록번호 123-45-67890</span>
              <span>통신판매업신고 제2026-서울강남-01234호</span>
              <span>서울특별시 강남구 테헤란로 123, 10층</span>
              <span>고객센터 1544-0000</span>
              <span>이메일 help@richlink.co.kr</span>
            </div>
            <p className="mt-4 text-[11.5px] text-gray-300">
              © 2026 RichLink Co., Ltd. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
