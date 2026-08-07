import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WriteButton } from "@/components/community/WriteButton";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = { free: "자유게시판", review: "분양후기", qna: "질문답변", notice: "공지사항" };
const CAT_STYLE: Record<string, string> = {
  free: "bg-gray-400",
  review: "bg-gold",
  qna: "bg-blue-500",
  notice: "bg-red-500",
};

const PAGE_SIZE = 20;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const supabase = createClient();
  const category = searchParams.category ?? "all";
  const page = Math.max(1, Number(searchParams.page ?? "1"));

  type PostRow = {
    id: string;
    category: string;
    title: string;
    author: string;
    views: number;
    created_at: string;
    community_comments: { id: string }[];
  };

  // 공지사항은 페이지네이션과 무관하게 항상 전체 노출합니다.
  const { data: notices } = await supabase
    .from("community_posts")
    .select("id, category, title, author, views, created_at, community_comments(id)")
    .eq("category", "notice")
    .order("created_at", { ascending: false })
    .returns<PostRow[]>();

  let othersQuery = supabase
    .from("community_posts")
    .select("id, category, title, author, views, created_at, community_comments(id)", { count: "exact" })
    .neq("category", "notice")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (category !== "all" && category !== "notice") {
    othersQuery = othersQuery.eq("category", category);
  }

  const { data: others, count } = await othersQuery.returns<PostRow[]>();

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const showNotices = page === 1 && (category === "all" || category === "notice");
  const blockedNames = new Set(
    ((await supabase.from("blocked_authors").select("author_name")).data ?? []).map((b: any) => b.author_name)
  );

  const rows = [...(showNotices ? notices ?? [] : []), ...(others ?? [])];

  return (
    <section className="mx-auto max-w-[900px] px-8 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-[22px] font-semibold">커뮤니티</h1>
        <WriteButton />
      </div>

      <div className="mb-6 flex gap-2 border-b border-line pb-4">
        {[
          { key: "all", label: "전체" },
          { key: "notice", label: "공지사항" },
          { key: "free", label: "자유게시판" },
          { key: "review", label: "분양후기" },
          { key: "qna", label: "질문답변" },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/community?category=${t.key}`}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] ${
              category === t.key ? "bg-ink text-white" : "border border-line text-gray-600"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        {rows.length === 0 ? (
          <div className="px-5 py-20 text-center text-stone">등록된 게시글이 없습니다. 첫 글을 남겨보세요!</div>
        ) : (
          rows.map((p) => (
            <Link
              key={p.id}
              href={`/community/${p.id}`}
              className="flex items-center gap-4 border-b border-line px-5 py-4 text-[13.5px] last:border-0 hover:bg-mist/40"
            >
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${CAT_STYLE[p.category]}`}>
                {CAT_LABEL[p.category]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {p.category === "notice" && "📌 "}
                  {p.title}
                </p>
                <p className="mt-0.5 text-[12px] text-stone">
                  {blockedNames.has(p.author) ? "[차단된 사용자]" : p.author} · {new Date(p.created_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <div className="shrink-0 text-right text-[11.5px] text-stone">
                조회 {p.views}
                <br />
                댓글 {p.community_comments?.length ?? 0}
              </div>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/community?category=${category}&page=${p}`}
              className={`flex h-8 w-8 items-center justify-center rounded text-[13px] ${
                p === page ? "bg-ink text-white" : "border border-line text-gray-600 hover:border-ink"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
