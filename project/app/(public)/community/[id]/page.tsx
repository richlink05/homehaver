import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/supabase/get-profile";
import { PostActions } from "@/components/community/PostActions";
import { CommentSection } from "@/components/community/CommentSection";
import { renderContentWithMedia } from "@/lib/community-media";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = { free: "자유게시판", review: "분양후기", qna: "질문답변", notice: "공지사항" };
const CAT_STYLE: Record<string, string> = {
  free: "bg-gray-400",
  review: "bg-gold",
  qna: "bg-blue-500",
  notice: "bg-red-500",
};

export default async function CommunityPostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
  await (supabase.rpc as any)("increment_post_views", { p_post_id: params.id });

  type PostRow = {
    id: string;
    category: string;
    title: string;
    content: string;
    author: string;
    image_url: string | null;
    views: number;
    created_at: string;
  };

  const { data: post } = await supabase
    .from("community_posts")
    .select("id, category, title, content, author, image_url, views, created_at")
    .eq("id", params.id)
    .single<PostRow>();

  if (!post) notFound();

  const { data: comments } = await supabase
    .from("community_comments")
    .select("id, author, content, created_at")
    .eq("post_id", params.id)
    .order("created_at", { ascending: true })
    .returns<{ id: string; author: string; content: string; created_at: string }[]>();

  const { data: blockedRows } = await supabase
    .from("blocked_authors")
    .select("author_name")
    .returns<{ author_name: string }[]>();
  const blockedNames = new Set((blockedRows ?? []).map((b) => b.author_name));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const profile = await getProfileRole(supabase, user.id);
    isAdmin = profile?.role === "admin";
  }

  const displayAuthor = blockedNames.has(post.author) ? "[차단된 사용자]" : post.author;

  return (
    <section className="mx-auto max-w-[820px] px-8 py-12">
      <Link href="/community" className="mb-5 inline-block text-[12.5px] text-stone hover:text-gold-deep">
        ← 목록으로
      </Link>

      <div className="rounded-lg border border-line bg-white p-7">
        <div className="mb-3 flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${CAT_STYLE[post.category]}`}>
            {CAT_LABEL[post.category]}
          </span>
          <PostActions postId={post.id} isAdmin={isAdmin} />
        </div>

        <h1 className="mb-2.5 text-[20px] font-bold leading-snug">{post.title}</h1>
        <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-line pb-4 text-[12px] text-stone">
          <span>{displayAuthor}</span>
          <span>·</span>
          <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
          <span>·</span>
          <span>조회 {post.views}</span>
        </div>

        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url} alt="" className="mb-5 w-full rounded-md border border-line object-cover" />
        )}

        <div
          className="min-h-[100px] text-[14px] leading-relaxed text-gray-700"
          dangerouslySetInnerHTML={{ __html: renderContentWithMedia(post.content) }}
        />

        <CommentSection postId={post.id} comments={comments ?? []} blockedNames={blockedNames} />
      </div>
    </section>
  );
}
