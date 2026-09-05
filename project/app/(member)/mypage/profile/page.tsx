import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MypageShell } from "@/components/mypage/MypageShell";
import { ProfileForm } from "@/components/mypage/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, email, company_name, role")
    .eq("id", user.id)
    .single<{
      name: string | null;
      phone: string | null;
      email: string | null;
      company_name: string | null;
      role: "user" | "agency" | "admin";
    }>();

  return (
    <MypageShell role={profile?.role} name={profile?.name} activeHref="/mypage/profile">
      <div className="mb-8">
        <h1 className="mb-1.5 font-serif text-[22px] font-semibold">프로필 설정</h1>
        <p className="text-[13.5px] text-stone">이름, 연락처, 업체명을 수정할 수 있습니다.</p>
      </div>

      <ProfileForm
        isAgency={profile?.role === "agency"}
        initial={{
          name: profile?.name ?? "",
          phone: profile?.phone ?? "",
          companyName: profile?.company_name ?? "",
        }}
        email={profile?.email ?? user.email ?? ""}
      />
    </MypageShell>
  );
}
