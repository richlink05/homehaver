import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/admin/approvals", label: "분양 승인" },
  { href: "/admin/users", label: "회원관리" },
  { href: "/admin/ads", label: "광고관리" },
  { href: "/admin/banners", label: "배너관리" },
  { href: "/admin/notices", label: "공지사항" },
  { href: "/admin/popups", label: "팝업관리" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", user?.id).single();

  if (!user || profile?.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      <aside className="w-[220px] flex-shrink-0 bg-ink px-5 py-8 text-white">
        <p className="mb-1 px-2 font-serif text-lg font-semibold">
          Rich<span className="text-gold">Link</span>
        </p>
        <p className="mb-8 px-2 text-xs text-white/50">관리자 · {profile?.name ?? ""}</p>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2.5 text-[13.5px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-mist/40 px-10 py-9">{children}</main>
    </div>
  );
}
