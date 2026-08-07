"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Report = {
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

export function ReportCard({ report }: { report: Report }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const act = async (action: "delete_post" | "block_author" | "dismiss") => {
    const confirmMsg =
      action === "block_author"
        ? `"${report.post_author}" 님을 차단하고 글을 삭제하시겠습니까? (커뮤니티 노출 차단 + 분양담당자 계정이면 활동도 금지됩니다)`
        : action === "delete_post"
        ? `"${report.post_title}" 게시글을 삭제하시겠습니까?`
        : "이 신고를 반려하시겠습니까?";
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
    const { error } = await (supabase.rpc as any)("resolve_report", { p_report_id: report.id, p_action: action });
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13.5px] font-semibold">
          "{report.post_title}" · 작성자: {report.post_author}
        </p>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            report.status === "대기"
              ? "border border-line text-gray-500"
              : report.status === "반려"
              ? "bg-mist text-gray-500"
              : "bg-gold/15 text-gold-deep"
          }`}
        >
          {report.status}
        </span>
      </div>
      <p className="mb-2.5 text-[11.5px] text-stone">
        신고일 {new Date(report.created_at).toLocaleDateString("ko-KR")} · 사유: {report.reason}
      </p>
      <p className="mb-3 rounded bg-mist px-3.5 py-2.5 text-[13px] text-gray-700">{report.detail}</p>
      {report.evidence_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={report.evidence_url} alt="증거자료" className="mb-3 max-w-[220px] rounded border border-line" />
      )}

      {report.status === "대기" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => act("delete_post")}
            disabled={loading}
            className="rounded border border-red-200 px-3.5 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            글 삭제
          </button>
          <button
            onClick={() => act("block_author")}
            disabled={loading}
            className="rounded border border-red-200 px-3.5 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            작성자 활동 금지 + 노출 차단
          </button>
          <button
            onClick={() => act("dismiss")}
            disabled={loading}
            className="rounded border border-line px-3.5 py-1.5 text-xs text-gray-600 disabled:opacity-50"
          >
            반려
          </button>
        </div>
      )}
    </div>
  );
}
