import { ListingStatusActions } from "@/components/listing/ListingStatusActions";
import { ActivationRequestButton } from "@/components/listing/ActivationRequestButton";

const HQ_PHONE = "1544-0892";

export function ManagerContact({
  listingId,
  listingTitle,
  managerName,
  managerPhone,
  hasManager,
  isAgencyViewer,
  isRegistrant,
  alreadyManagingElsewhere,
}: {
  listingId: string;
  listingTitle: string;
  managerName: string | null;
  managerPhone: string | null;
  hasManager: boolean;
  isAgencyViewer: boolean;
  isRegistrant: boolean;
  alreadyManagingElsewhere: boolean;
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
        alreadyManagingElsewhere ? (
          <p className="max-w-[220px] text-right text-[12px] leading-relaxed text-stone">
            이미 다른 현장을 담당중이라 신청할 수 없습니다.
            <br />
            (1인 1현장 원칙)
          </p>
        ) : isRegistrant ? (
          // 본인이 등록한 현장은 등록 시 이미 서류를 제출·검토받았으므로 바로 활성화합니다.
          <ListingStatusActions listingId={listingId} action="activate" />
        ) : (
          // 본인이 등록하지 않은(주인없는) 현장은 서류 제출 후 관리자 승인을 거쳐야 합니다.
          <ActivationRequestButton listingId={listingId} listingTitle={listingTitle} />
        )
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
            <p className="max-w-[220px] text-right text-[12px] leading-relaxed text-stone">
              담당자가 배정된 현장입니다.
              <br />
              위 <b className="text-gold-deep">즐겨찾기</b>를 눌러두시면, 담당자가 이탈할 때 알려드립니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
