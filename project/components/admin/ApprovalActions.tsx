"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApprovalActions({ listingId, approved }: { listingId: string; approved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const patchApproval = async (is_approved: boolean, rejection_reason?: string) => {
    setLoading(true);
    await fetch(`/api/admin/listings/${listingId}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved, rejection_reason }),
    });
    setLoading(false);
    router.refresh();
  };

  const handleReject = () => {
    if (!reason.trim()) {
      setReasonError("반려 사유를 입력해주세요.");
      return;
    }
    setShowReasonBox(false);
    patchApproval(false, reason.trim());
    setReason("");
  };

  const handleDelete = async () => {
    if (!confirm("이 현장을 완전히 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    setLoading(true);
    await fetch(`/api/admin/listings/${listingId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {approved ? (
        <button
          onClick={() => patchApproval(false)}
          disabled={loading}
          className="rounded border border-line px-3.5 py-1.5 text-xs text-gray-600 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
        >
          승인 취소
        </button>
      ) : (
        <>
          <button
            onClick={() => patchApproval(true)}
            disabled={loading}
            className="rounded bg-gold px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gold-deep disabled:opacity-50"
          >
            {loading ? "처리 중..." : "승인"}
          </button>
          <button
            onClick={() => {
              setReason("");
              setReasonError("");
              setShowReasonBox(true);
            }}
            disabled={loading}
            className="rounded border border-red-200 px-3.5 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            반려
          </button>
        </>
      )}

      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded border border-line px-3.5 py-1.5 text-xs text-gray-400 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-50"
      >
        삭제
      </button>

      {showReasonBox && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-[400px] rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-[15px] font-semibold">반려 사유 입력</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="반려 사유를 입력해주세요. 이 내용은 담당자에게 그대로 전달됩니다."
              className="h-[100px] w-full resize-none rounded border border-line px-3 py-2.5 text-[13px] outline-none focus:border-gold"
            />
            {reasonError && <p className="mt-1 text-xs text-red-500">{reasonError}</p>}
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => setShowReasonBox(false)}
                className="flex-1 rounded border border-line py-2.5 text-[13px] text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                className="flex-1 rounded bg-ink py-2.5 text-[13px] font-semibold text-white"
              >
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
