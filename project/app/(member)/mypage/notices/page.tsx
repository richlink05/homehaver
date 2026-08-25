import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoticeAccordion } from "@/components/mypage/NoticeAccordion";

export const dynamic = "force-dynamic";

export default async function MypageNoticesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type NoticeRow = {
    id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
  };

  const { data: notices } = await supabase
    .from("admin_notices")
    .select("id, title, content, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<NoticeRow[]>();

  return (
    <section className="mx-auto max-w-[900px] px-8 py-12">
      <div className="mb-8">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">공지사항</h1>
        <p className="text-[13.5px] text-stone">관리자가 등록한 공지사항입니다.</p>
      </div>

      <NoticeAccordion notices={notices ?? []} />
    </section>
  );
}
