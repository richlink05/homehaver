import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { BannerManager } from "@/components/admin/BannerManager";

export const dynamic = "force-dynamic";


export default async function BannersPage() {
  const supabase = createClient();
  const { data: banners } = await supabase.from("admin_banners").select("*").order("sort_order");

  return (
    <div>
      <AdminPageHeader title="배너관리" description="메인/검색결과 페이지에 노출되는 배너를 관리합니다." />
      <BannerManager banners={banners ?? []} />
    </div>
  );
}
