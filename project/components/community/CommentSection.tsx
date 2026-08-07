"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Comment = { id: string; author: string; content: string; created_at: string };

export function CommentSection({
  postId,
  comments,
  blockedNames,
}: {
  postId: string;
  comments: Comment[];
  blockedNames: Set<string>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
    const { error: rpcError } = await (supabase.rpc as any)("create_comment", {
      p_post_id: postId,
      p_author: author.trim() || "익명",
      p_content: content.trim(),
    });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setContent("");
    router.refresh();
  };

  return (
    <div className="mt-9 border-t border-line pt-6">
      <h4 className="mb-4 text-[13.5px] font-semibold">댓글 {comments.length}</h4>

      {comments.length === 0 ? (
        <p className="text-[12.5px] text-stone">아직 댓글이 없습니다.</p>
      ) : (
        <div className="mb-5">
          {comments.map((c) => (
            <div key={c.id} className="border-b border-line py-3 text-[13px] last:border-0">
              <span className="mr-2 font-semibold">{blockedNames.has(c.author) ? "[차단된 사용자]" : c.author}</span>
              <span className="text-[11px] text-stone">{new Date(c.created_at).toLocaleDateString("ko-KR")}</span>
              <p className="mt-1">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="이름"
          className="w-[110px] rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-gold"
        />
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="댓글을 입력하세요"
          className="flex-1 rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-gold"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="rounded bg-ink px-5 text-[12.5px] font-semibold text-white disabled:opacity-60"
        >
          등록
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
