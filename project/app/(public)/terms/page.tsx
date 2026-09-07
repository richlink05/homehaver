import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description: "홈해버 이용약관",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[760px] px-8 py-16">
      <p className="mb-3.5 text-xs font-bold tracking-[3px] text-gold-deep">TERMS OF SERVICE</p>
      <h1 className="mb-2 font-serif text-[28px] font-semibold">이용약관</h1>
      <p className="mb-10 text-[12.5px] text-stone">시행일 2026년 1월 1일</p>

      <div className="space-y-8 text-[13.5px] leading-[1.9] text-gray-700">
        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">제1조 (목적)</h2>
          <p>
            이 약관은 (주)리치디앤씨(이하 "회사")가 운영하는 분양 정보 검색 플랫폼 홈해버(이하 "서비스")의 이용과
            관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">제2조 (용어의 정의)</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>"서비스"란 회사가 제공하는 분양 정보 검색, 상담신청, 분양 등록 등 일체의 서비스를 의미합니다.</li>
            <li>"이용자"란 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 고객 및 분양담당자를 의미합니다.</li>
            <li>"분양담당자"란 회원가입 및 관리자 승인을 거쳐 현장 정보를 등록·관리하는 이용자를 의미합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">제3조 (약관의 효력 및 변경)</h2>
          <p>
            회사는 이 약관의 내용을 서비스 초기 화면에 게시하며, 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수
            있습니다. 개정된 약관은 적용일자 및 개정사유를 명시하여 사전 공지합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">제4조 (서비스의 제공 및 변경)</h2>
          <p>
            회사는 분양 정보 검색, 상담신청 접수, 분양 현장 등록 및 관리 기능을 제공하며, 서비스의 내용은
            운영상·기술상 필요에 따라 변경될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">제5조 (회원가입 및 승인)</h2>
          <p>
            분양담당자로 서비스를 이용하고자 하는 자는 회사가 정한 절차에 따라 회원가입을 신청하며, 이메일 인증 및
            관리자 승인을 완료한 이후 정상적으로 서비스를 이용할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">제6조 (이용자의 의무)</h2>
          <p>
            이용자는 관계 법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 하며,
            허위 정보를 등록하거나 타인의 정보를 도용해서는 안 됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">제7조 (면책조항)</h2>
          <p>
            회사는 이용자가 등록한 분양 정보의 정확성에 대해 보증하지 않으며, 이용자 간 또는 이용자와 제3자 간에
            서비스를 매개로 발생한 분쟁에 대해 개입하지 않습니다.
          </p>
        </section>
      </div>

      <p className="mt-10 text-[12.5px] text-stone">
        ※ 본 페이지는 예시 문서이며, 실제 서비스 운영 시 법률 검토를 거친 약관으로 교체해야 합니다.
      </p>

      <Link href="/" className="mt-12 inline-block text-[13px] font-semibold text-gold-deep">
        ← 홈으로
      </Link>
    </div>
  );
}
