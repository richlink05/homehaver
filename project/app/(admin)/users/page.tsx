import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { UserApprovalToggle } from "@/components/admin/UserApprovalToggle";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string; filter?: "pending" | "approved" };
}) {
  const supabase = createClient();

  let query = supabase
    .from("profiles")
    .select("id, name, email, phone, role, company_name, is_approved, created_at")
    .order("created_at", { ascending: false });

  if (searchParams.q) {
    query = query.or(`name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`);
  }
  if (searchParams.filter === "pending") query = query.eq("is_approved", false);
  if (searchParams.filter === "approved") query = query.eq("is_approved", true);

  const { data: users } = await query;

  return (
    <div>
      <AdminPageHeader title="회원관리" description="가입 신청한 분양담당자를 승인하고 회원 등급을 관리합니다." />

      <div className="mb-5 flex gap-2">
        <FilterTab href="/admin/users" active={!searchParams.filter} label="전체" />
        <FilterTab href="/admin/users?filter=pending" active={searchParams.filter === "pending"} label="승인대기" />
        <FilterTab href="/admin/users?filter=approved" active={searchParams.filter === "approved"} label="승인완료" />
      </div>

      <form className="mb-5">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="이름 또는 이메일로 검색"
          className="w-72 rounded border border-line bg-white px-3.5 py-2 text-[13px] outline-none focus:border-gold"
        />
      </form>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">이름</th>
              <th className="px-5 py-3 font-medium">이메일</th>
              <th className="px-5 py-3 font-medium">연락처</th>
              <th className="px-5 py-3 font-medium">소속</th>
              <th className="px-5 py-3 font-medium">등급</th>
              <th className="px-5 py-3 font-medium">승인상태</th>
              <th className="px-5 py-3 font-medium text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                <td className="px-5 py-3.5 font-medium">{u.name}</td>
                <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                <td className="px-5 py-3.5 text-gray-600">{u.phone ?? "-"}</td>
                <td className="px-5 py-3.5 text-gray-600">{u.company_name ?? "-"}</td>
                <td className="px-5 py-3.5">
                  <RoleSelect userId={u.id} role={u.role} />
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                      u.is_approved ? "bg-gold text-white" : "border border-line text-gray-500"
                    }`}
                  >
                    {u.is_approved ? "승인완료" : "승인대기"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <UserApprovalToggle userId={u.id} approved={u.is_approved} />
                </td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-stone">
                  표시할 회원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterTab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
        active ? "bg-ink text-white" : "border border-line text-gray-600 hover:border-ink"
      }`}
    >
      {label}
    </a>
  );
}
