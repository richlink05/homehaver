import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MypageShell } from "@/components/mypage/MypageShell";

export const dynamic = "force-dynamic";

export default async function MyPage() {
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

  const isAgency = profile?.role === "agency";

  return (
    <MypageShell role={profile?.role} name={profile?.name} activeHref={isAgency ? "/listings" : "/mypage/favorites"}>
      <h2 className="mb-3 font-serif text-[22px] font-semibold">환영합니다, {profile?.name} 님</h2>
      {isAgency ? (
        <p className="text-sm text-stone">
          왼쪽 메뉴에서 <b className="text-ink">내가 등록한 현장</b>의 승인 상태를 확인하거나,{" "}
          <b className="text-ink">상담문의</b>를 확인하실 수 있습니다.
        </p>
      ) : (
        <p className="text-sm text-stone">
          왼쪽 메뉴에서 <b className="text-ink">즐겨찾기</b>한 현장이나{" "}
          <b className="text-ink">상담 신청 내역</b>을 확인하실 수 있습니다.
        </p>
      )}
    </MypageShell>
  );
}
