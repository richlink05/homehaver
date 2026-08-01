export function ManagerContact({
  managerName,
  managerPhone,
}: {
  managerName: string | null;
  managerPhone: string | null;
}) {
  if (!managerName || !managerPhone) return null;

  return (
    <div className="mt-9 flex flex-wrap items-center justify-between gap-5 rounded-lg border border-line bg-gradient-to-br from-[#FBF9F4] to-white p-6">
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-gold text-base font-bold text-white">
          {managerName.charAt(0)}
        </div>
        <div>
          <p className="mb-0.5 text-[11.5px] font-semibold text-gold-deep">이 현장 담당자</p>
          <p className="mb-0.5 text-[15.5px] font-bold">{managerName}</p>
          <p className="text-[13px] text-gray-600">{managerPhone}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <a
          href={`tel:${managerPhone.replace(/-/g, "")}`}
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
    </div>
  );
}
