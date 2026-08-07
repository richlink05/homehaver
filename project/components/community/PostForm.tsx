"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export function PostForm({
  isAdmin,
  editing,
}: {
  isAdmin: boolean;
  editing?: {
    id: string;
    category: string;
    title: string;
    content: string;
    author: string;
    image_url: string | null;
  };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [category, setCategory] = useState(editing?.category ?? "free");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [content, setContent] = useState(editing?.content ?? "");
  const [author, setAuthor] = useState(editing?.author ?? "");
  const [password, setPassword] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editing?.image_url ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("이미지는 jpg 또는 png 파일만 첨부할 수 있습니다.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("이미지는 3MB 이하만 첨부할 수 있습니다.");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImageIfNeeded = async (): Promise<string | null> => {
    if (!imageFile) return editing?.image_url ?? null;
    const ext = imageFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("community-images").upload(path, imageFile);
    if (uploadError) throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
    const {
      data: { publicUrl },
    } = supabase.storage.from("community-images").getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!author.trim() || !title.trim() || !content.trim()) {
      setError("작성자 / 제목 / 내용을 모두 입력해주세요.");
      return;
    }
    if (!editing && !password) {
      setError("비밀번호를 입력해주세요. (수정/삭제 시 필요합니다)");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImageIfNeeded();

      if (editing) {
        // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
        const { error: rpcError } = await (supabase.rpc as any)("update_post", {
          p_post_id: editing.id,
          p_password: editPassword,
          p_category: category,
          p_title: title,
          p_content: content,
          p_image_url: imageUrl,
        });
        if (rpcError) throw new Error(rpcError.message);
        router.push(`/community/${editing.id}`);
      } else {
        const { data: newId, error: rpcError } = await (supabase.rpc as any)("create_post", {
          p_category: category,
          p_title: title,
          p_content: content,
          p_author: author,
          p_password: password,
          p_image_url: imageUrl,
        });
        if (rpcError) throw new Error(rpcError.message);
        router.push(`/community/${newId}`);
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-white p-6">
      <h3 className="mb-5 font-serif text-[18px] font-semibold">{editing ? "글 수정" : "새 글쓰기"}</h3>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[12.5px] text-gray-600">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-gold"
          >
            <option value="free">자유게시판</option>
            <option value="review">분양후기</option>
            <option value="qna">질문답변</option>
            {isAdmin && <option value="notice">공지사항 (관리자 전용)</option>}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] text-gray-600">작성자 이름</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            readOnly={!!editing}
            placeholder="닉네임 또는 이름"
            className={`w-full rounded border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-gold ${
              editing ? "bg-mist text-gray-500" : ""
            }`}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-[12.5px] text-gray-600">제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-gold"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-[12.5px] text-gray-600">내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요. 유튜브·Vimeo 링크를 붙여넣으면 글에서 바로 재생됩니다."
          className="h-[160px] w-full resize-none rounded border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-gold"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-[12.5px] text-gray-600">이미지 첨부 (선택, 3MB 이하 jpg/png)</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
          className="text-[13px]"
        />
        {imagePreview && (
          <div className="relative mt-2.5 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} className="max-h-[140px] rounded border border-line" alt="" />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mb-4">
          <label className="mb-1.5 block text-[12.5px] text-gray-600">비밀번호 확인</label>
          <input
            type="password"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="글쓰기 시 설정한 비밀번호"
            className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-gold"
          />
        </div>
      ) : (
        <div className="mb-4">
          <label className="mb-1.5 block text-[12.5px] text-gray-600">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="글 수정/삭제 시 필요한 비밀번호"
            className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-gold"
          />
          <p className="mt-1 text-[11px] text-stone">나중에 이 글을 수정하거나 삭제할 때 필요합니다.</p>
        </div>
      )}

      {error && <p className="mb-3 text-[12.5px] text-red-500">{error}</p>}

      <div className="flex justify-end gap-2.5">
        <button
          onClick={() => router.back()}
          className="rounded border border-line px-5 py-2.5 text-[13px] text-gray-600"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded bg-gold px-6 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {loading ? "처리 중..." : editing ? "수정 완료" : "등록하기"}
        </button>
      </div>
    </div>
  );
}
