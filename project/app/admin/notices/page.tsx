import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { NoticeManager } from "@/components/admin/NoticeManager";

export default async function NoticesPage() {
  const supabase = createClient();
  const { data: notices } = await supabase
    .from("admin_notices")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <AdminPageHeader title="공지사항" description="회원에게 노출되는 공지사항을 등록하고 관리합니다." />
      <NoticeManager notices={notices ?? []} />
    </div>
  );
}
