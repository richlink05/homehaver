import { ListingStatusActions } from "@/components/listing/ListingStatusActions";

const HQ_PHONE = "1544-0892";

export function ManagerContact({
  listingId,
  managerName,
  managerPhone,
  hasManager,
  isAgencyViewer,
}: {
  listingId: string;
  managerName: string | null;
  managerPhone: string | null;
  hasManager: boolean;
  isAgencyViewer: boolean;
}) {
  const displayName = hasManager && managerName ? managerName : "홈페이지 고객센터";
  const displayPhone = hasManager && managerPhone ? managerPhone : HQ_PHONE;

  return (
    <div className="mt-9 flex flex-wrap items-center justify-between gap-5 rounded-lg border border-line bg-gradient-to-br from-[#FBF9F4] to-white p-6">
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-gold text-base font-bold text-white">
          {displayName.charAt(0)}
        </div>
        <div>
          <p className="mb-0.5 text-[11.5px] font-semibold text-gold-deep">
            {hasManager ? "이 현장 담당자" : "담당자 미배정 현장"}
          </p>
          <p className="mb-0.5 text-[15.5px] font-bold">{displayName}</p>
          <p className="text-[13px] text-gray-600">
            {displayPhone}
            {!hasManager && " 로 문의해주세요"}
          </p>
        </div>
      </div>

      {!hasManager && isAgencyViewer ? (
        <ListingStatusActions listingId={listingId} action="activate" />
      ) : (
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <a
              href={`tel:${displayPhone.replace(/-/g, "")}`}
              className="rounded-md bg-gold px-4.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-gold-deep"
            >
              전화 문의
            </a>
            <a
              href="#consult"
              className="rounded-md border border-ink px-4.5 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
            >
              상담 신청하기
            </a>
          </div>
          {hasManager && isAgencyViewer && (
            <ListingStatusActions listingId={listingId} action="join_waitlist" />
          )}
        </div>
      )}
    </div>
  );
}
