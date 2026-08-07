import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { KeywordManager } from "@/components/admin/KeywordManager";
import { PostDeleteButton } from "@/components/admin/PostDeleteButton";
import { ReportCard } from "@/components/admin/ReportCard";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = { free: "자유게시판", review: "분양후기", qna: "질문답변", notice: "공지사항" };

export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams: { reportFilter?: "대기" | "처리완료" | "반려" };
}) {
  const supabase = createClient();
  const reportFilter = searchParams.reportFilter ?? "대기";

  type PostRow = { id: string; category: string; title: string; author: string; views: number; created_at: string };
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id, category, title, author, views, created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<PostRow[]>();

  const { data: keywords } = await supabase
    .from("banned_keywords")
    .select("id, keyword")
    .order("keyword")
    .returns<{ id: string; keyword: string }[]>();

  type ReportRow = {
    id: string;
    post_id: string | null;
    post_title: string;
    post_author: string;
    reason: string;
    detail: string | null;
    evidence_url: string | null;
    status: "대기" | "처리완료" | "반려";
    created_at: string;
  };
  const { data: reports } = await supabase
    .from("community_reports")
    .select("id, post_id, post_title, post_author, reason, detail, evidence_url, status, created_at")
    .eq("status", reportFilter)
    .order("created_at", { ascending: false })
    .returns<ReportRow[]>();

  return (
    <div>
      <AdminPageHeader title="커뮤니티" description="게시글을 관리하고 스팸/광고 방지를 위한 금지 키워드를 설정합니다." />

      <h4 className="mb-3 text-[13.5px] font-semibold">금지 키워드 관리</h4>
      <p className="mb-3.5 -mt-1.5 text-[12px] text-stone">
        아래 키워드가 제목 또는 내용에 포함된 글은 커뮤니티에 작성할 수 없습니다.
      </p>
      <KeywordManager keywords={keywords ?? []} />

      <h4 className="mb-3 mt-9 text-[13.5px] font-semibold">게시글 관리</h4>
      <div className="mb-9 overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-line bg-mist/60 text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">카테고리</th>
              <th className="px-5 py-3 font-medium">제목</th>
              <th className="px-5 py-3 font-medium">작성자</th>
              <th className="px-5 py-3 font-medium">작성일</th>
              <th className="px-5 py-3 font-medium">조회</th>
              <th className="px-5 py-3 text-right font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {(posts ?? []).map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-mist/30">
                <td className="px-5 py-3.5">
                  <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                    {CAT_LABEL[p.category]}
                  </span>
                </td>
                <td className="max-w-[260px] truncate px-5 py-3.5 font-medium">{p.title}</td>
                <td className="px-5 py-3.5 text-gray-600">{p.author}</td>
                <td className="px-5 py-3.5 text-gray-500">{new Date(p.created_at).toLocaleDateString("ko-KR")}</td>
                <td className="px-5 py-3.5 text-gray-500">{p.views}</td>
                <td className="px-5 py-3.5 text-right">
                  <PostDeleteButton postId={p.id} />
                </td>
              </tr>
            ))}
            {(posts ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-stone">
                  게시글이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h4 className="mb-3 text-[13.5px] font-semibold">신고내역</h4>
      <div className="mb-4 flex gap-2">
        {(["대기", "처리완료", "반려"] as const).map((s) => (
          <a
            key={s}
            href={`/admin/community?reportFilter=${s}`}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] ${
              reportFilter === s ? "bg-ink text-white" : "border border-line text-gray-600"
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      <div className="space-y-3.5">
        {(reports ?? []).map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
        {(reports ?? []).length === 0 && (
          <div className="rounded-lg border border-line bg-white px-5 py-14 text-center text-stone">
            해당 상태의 신고내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
