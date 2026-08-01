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
      </body>
    </html>
  );
}
