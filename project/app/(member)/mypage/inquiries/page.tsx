import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";


const STATUS_STYLE: Record<string, string> = {
  대기: "bg-mist text-gray-600",
  응답완료: "bg-gold/15 text-gold-deep",
};

export default async function MyInquiriesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("id, name, phone, message, status, created_at, listings(id, title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto grid max-w-[1100px] grid-cols-[220px_1fr] gap-12 px-8 py-12">
      <MypageSidebarPlaceholder />

      <div>
        <h2 className="mb-6 font-serif text-[22px] font-semibold">상담 신청 내역</h2>

        {inquiries && inquiries.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <table className="w-full text-left text-[13.5px]">
              <thead className="border-b border-line bg-mist/60 text-xs text-stone">
                <tr>
                  <th className="px-5 py-3 font-medium">분양명</th>
                  <th className="px-5 py-3 font-medium">문의내용</th>
                  <th className="px-5 py-3 font-medium">상태</th>
                  <th className="px-5 py-3 font-medium">신청일</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((q: any) => (
                  <tr key={q.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                    <td className="px-5 py-3.5 font-medium">{q.listings?.title ?? "-"}</td>
                    <td className="max-w-[280px] truncate px-5 py-3.5 text-gray-600">{q.message || "-"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${STATUS_STYLE[q.status] ?? "bg-mist text-gray-600"}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(q.created_at).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-stone">신청한 상담 내역이 없습니다.</p>
        )}
      </div>
    </section>
  );
}

// 실제 프로젝트에서는 mypage/page.tsx의 사이드바를 공용 레이아웃(app/(member)/mypage/layout.tsx)으로
// 분리해 모든 마이페이지 하위 라우트에서 재사용하는 것을 권장합니다.
function MypageSidebarPlaceholder() {
  return (
    <aside className="border-r border-line pr-6">
      <nav>
        {[
          { label: "찜한 분양", href: "/mypage" },
          { label: "최근 본 현장", href: "/mypage/recent" },
          { label: "상담 신청 내역", href: "/mypage/inquiries" },
          { label: "내가 쓴 후기", href: "/mypage/reviews" },
          { label: "프로필 설정", href: "/mypage/profile" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`block border-b border-line py-2.5 text-sm hover:text-gold-deep ${
              item.href === "/mypage/inquiries" ? "font-semibold text-gold-deep" : "text-gray-600"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
