"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ActivationRequestButton({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [workAgreementFile, setWorkAgreementFile] = useState<File | null>(null);
  const [businessCardFile, setBusinessCardFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);

  const submit = async () => {
    setError("");
    if (!workAgreementFile || !businessCardFile) {
      setError("근무이행각서와 명함을 모두 첨부해주세요.");
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      const uploadDoc = async (file: File, label: string) => {
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${user.id}/${Date.now()}-${label}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("verification-docs").upload(path, file);
        if (uploadError) throw new Error(`${label} 업로드 실패: ${uploadError.message}`);
        return path;
      };

      const workAgreementPath = await uploadDoc(workAgreementFile, "work-agreement");
      const businessCardPath = await uploadDoc(businessCardFile, "business-card");

      // ⚠️ insert() 입력값 타입 추론 문제 우회 (다른 insert/update 호출과 동일한 이유)
      const { data: inserted, error: insertError } = await (supabase.from("manager_activation_requests") as any)
        .insert({
          listing_id: listingId,
          requester_id: user.id,
          work_agreement_path: workAgreementPath,
          business_card_path: businessCardPath,
        })
        .select("id")
        .single();
      if (insertError) throw new Error(insertError.message);

      // ⚠️ rpc() 인자 타입 추론 문제 우회 (increment_view_count와 동일한 이유)
      const { data: rank } = await (supabase.rpc as any)("get_my_activation_rank", {
        p_request_id: inserted.id,
      });
      if (typeof rank === "number") setMyRank(rank);

      setSubmitted(true);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-gold px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gold-deep"
      >
        담당자 신청 (서류 제출)
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-[420px] rounded-lg bg-white p-6 shadow-xl">
            {submitted ? (
              <div className="text-center">
                <div className="mb-2.5 text-[32px]">✓</div>
                <p className="mb-1.5 text-[14px] font-semibold">신청이 접수되었습니다</p>
                {myRank && (
                  <p className="mb-2.5 text-[13px] font-semibold text-gold-deep">
                    현재 이 현장에 {myRank}번째로 접수되었습니다.
                  </p>
                )}
                <p className="mb-6 text-[12.5px] text-stone">
                  관리자 검토 후 승인되면 "{listingTitle}" 현장의 담당자로 활성화되고 포인트가 차감됩니다.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full rounded bg-ink py-2.5 text-[13px] font-semibold text-white"
                >
                  확인
                </button>
              </div>
            ) : (
              <>
                <h3 className="mb-1.5 text-[15px] font-semibold">담당자 신청</h3>
                <p className="mb-5 text-[12.5px] text-stone">
                  1인 1현장 원칙에 따라, 실제 근무자인지 확인하기 위한 서류를 제출해주세요. 관리자 승인 후
                  15,000P가 차감되며 담당자로 활성화됩니다.
                </p>

                <div className="mb-4">
                  <label className="mb-1.5 block text-[12.5px] text-gray-600">근무이행각서</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(e) => setWorkAgreementFile(e.target.files?.[0] ?? null)}
                    className="w-full text-[13px]"
                  />
                </div>
                <div className="mb-5">
                  <label className="mb-1.5 block text-[12.5px] text-gray-600">명함</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(e) => setBusinessCardFile(e.target.files?.[0] ?? null)}
                    className="w-full text-[13px]"
                  />
                </div>

                {error && <p className="mb-3 text-[12.5px] text-red-500">{error}</p>}

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded border border-line py-2.5 text-[13px] text-gray-600"
                  >
                    취소
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="flex-1 rounded bg-gold py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
                  >
                    {loading ? "제출 중..." : "제출하기"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
