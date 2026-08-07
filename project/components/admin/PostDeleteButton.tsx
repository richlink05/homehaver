"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PostDeleteButton({ postId }: { postId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm("이 게시글을 삭제하시겠습니까? 댓글도 함께 삭제됩니다.")) return;
    // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
    const { error } = await (supabase.rpc as any)("admin_delete_post", { p_post_id: postId });
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      className="rounded border border-line px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-red-300 hover:text-red-500"
    >
      삭제
    </button>
  );
}
