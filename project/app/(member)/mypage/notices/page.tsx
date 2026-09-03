import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NoticeAccordion } from "@/components/mypage/NoticeAccordion";
import { MypageShell } from "@/components/mypage/MypageShell";

export const dynamic = "force-dynamic";

export default async function MypageNoticesPage() {
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
    <MypageShell role={profile?.role} name={profile?.name} activeHref="/mypage/notices">
      <div className="mb-8">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">공지사항</h1>
        <p className="text-[13.5px] text-stone">관리자가 등록한 공지사항입니다.</p>
      </div>

      <NoticeAccordion notices={notices ?? []} />
    </MypageShell>
  );
}
