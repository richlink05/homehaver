"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PostActions({ postId, isAdmin }: { postId: string; isAdmin: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  const [pwModal, setPwModal] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  const handleDelete = async () => {
    if (isAdmin) {
      if (!confirm("이 게시글을 삭제하시겠습니까? (관리자 권한)")) return;
      // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
      const { error } = await (supabase.rpc as any)("admin_delete_post", { p_post_id: postId });
      if (error) return alert(error.message);
      router.push("/community");
      router.refresh();
      return;
    }
    setPwModal(true);
    setPw("");
    setPwError("");
  };

  const handleEdit = () => {
    router.push(`/community/${postId}/edit`);
  };

  const confirmPassword = async () => {
    if (!pw) {
      setPwError("비밀번호를 입력해주세요.");
      return;
    }
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;
    const { error } = await (supabase.rpc as any)("delete_post", { p_post_id: postId, p_password: pw });
    if (error) {
      setPwError(error.message);
      return;
    }
    setPwModal(false);
    router.push("/community");
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-3.5 text-[12px] font-semibold">
        <button onClick={handleEdit} className="text-stone hover:text-gold-deep">
          수정
        </button>
        <button onClick={handleDelete} className="text-stone hover:text-gold-deep">
          삭제
        </button>
        <button onClick={() => setReportOpen(true)} className="text-red-400 hover:text-red-500">
          신고하기
        </button>
      </div>

      {pwModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-[360px] rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-[15px] font-semibold">비밀번호 확인</h3>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmPassword()}
              placeholder="글쓰기 시 설정한 비밀번호"
              className="w-full rounded border border-line px-3 py-2.5 text-[13.5px] outline-none focus:border-gold"
            />
            {pwError && <p className="mt-1.5 text-[12px] text-red-500">{pwError}</p>}
            <div className="mt-4 flex gap-2.5">
              <button onClick={() => setPwModal(false)} className="flex-1 rounded border border-line py-2.5 text-[13px] text-gray-600">
                취소
              </button>
              <button onClick={confirmPassword} className="flex-1 rounded bg-ink py-2.5 text-[13px] font-semibold text-white">
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && <ReportModal postId={postId} onClose={() => setReportOpen(false)} />}
    </>
  );
}

function ReportModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const supabase = createClient();
  const [reason, setReason] = useState("스팸/광고");
  const [detail, setDetail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("이미지 파일만 첨부할 수 있습니다.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const submit = async () => {
    if (!detail.trim()) {
      setError("상세 내용을 입력해주세요.");
      return;
    }
    setLoading(true);

    let evidenceUrl: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `reports/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("community-images").upload(path, file);
      if (!upErr) {
        evidenceUrl = supabase.storage.from("community-images").getPublicUrl(path).data.publicUrl;
      }
    }

    const { data: post } = await supabase
      .from("community_posts")
      .select("title, author")
      .eq("id", postId)
      .single<{ title: string; author: string }>();

    const { error: insertError } = await (supabase.from("community_reports") as any).insert({
      post_id: postId,
      post_title: post?.title ?? "",
      post_author: post?.author ?? "",
      reason,
      detail,
      evidence_url: evidenceUrl,
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    alert("신고가 접수되었습니다. 관리자 검토 후 처리됩니다.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-[400px] rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-[15px] font-semibold">신고하기</h3>

        <label className="mb-1.5 block text-[12.5px] text-gray-600">신고 사유</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mb-3.5 w-full rounded border border-line px-3 py-2.5 text-[13.5px]"
        >
          <option>스팸/광고</option>
          <option>명예훼손/욕설</option>
          <option>허위사실</option>
          <option>기타</option>
        </select>

        <label className="mb-1.5 block text-[12.5px] text-gray-600">상세 내용</label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="신고 사유를 구체적으로 적어주세요"
          className="mb-3.5 h-[90px] w-full resize-none rounded border border-line px-3 py-2.5 text-[13.5px]"
        />

        <label className="mb-1.5 block text-[12.5px] text-gray-600">증거자료 첨부 (선택, 이미지)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="mb-2 text-[13px]"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} className="mb-3 max-h-[140px] rounded border border-line" alt="" />
        )}

        {error && <p className="mb-3 text-[12px] text-red-500">{error}</p>}

        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 rounded border border-line py-2.5 text-[13px] text-gray-600">
            취소
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded bg-red-500 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {loading ? "제출 중..." : "신고 제출"}
          </button>
        </div>
      </div>
    </div>
  );
}
