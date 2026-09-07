import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "홈해버 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[760px] px-8 py-16">
      <p className="mb-3.5 text-xs font-bold tracking-[3px] text-gold-deep">PRIVACY POLICY</p>
      <h1 className="mb-2 font-serif text-[28px] font-semibold">개인정보처리방침</h1>
      <p className="mb-10 text-[12.5px] text-stone">시행일 2026년 1월 1일</p>

      <div className="space-y-8 text-[13.5px] leading-[1.9] text-gray-700">
        <p>
          (주)리치디앤씨(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보보호법」 등 관련 법령을
          준수하고 있습니다. 회사는 개인정보처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 목적과 방식으로
          이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
        </p>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">1. 수집하는 개인정보 항목</h2>
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full min-w-[480px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="bg-mist">
                  <th className="border-b border-line px-3.5 py-2.5 font-semibold">구분</th>
                  <th className="border-b border-line px-3.5 py-2.5 font-semibold">수집 항목</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-line px-3.5 py-2.5">고객 (상담신청 시)</td>
                  <td className="border-b border-line px-3.5 py-2.5">이름, 연락처, 문의내용</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5">분양담당자 (회원가입 시)</td>
                  <td className="px-3.5 py-2.5">이름, 이메일, 휴대폰번호, 소속(선택), 비밀번호</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">2. 개인정보의 수집 및 이용목적</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>상담신청 접수 및 담당자 연결을 위한 고객 문의 처리</li>
            <li>분양담당자 회원가입, 본인확인(이메일 인증), 관리자 승인 절차 진행</li>
            <li>서비스 부정이용 방지 및 고지사항 전달</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">3. 개인정보의 보유 및 이용기간</h2>
          <p>
            회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후 해당 정보를 지체 없이 파기합니다. 단, 관계
            법령에 따라 보존할 필요가 있는 경우 일정 기간 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">4. 개인정보의 제3자 제공</h2>
          <p>
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않으며, 상담신청 시 입력된 정보는 해당 현장의
            담당자에게만 전달됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">5. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회, 수정, 삭제할 수 있으며, 회원 탈퇴를 통해
            개인정보 삭제를 요청할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-ink">6. 개인정보 보호책임자</h2>
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고 이용자의 불만처리 및 피해구제 등을 위하여
            개인정보 보호책임자를 지정하고 있습니다. (문의: help@homehaver.com / 1544-0000)
          </p>
        </section>
      </div>

      <p className="mt-10 text-[12.5px] text-stone">
        ※ 본 페이지는 예시 문서이며, 실제 서비스 운영 시 법률 검토를 거친 방침으로 교체해야 합니다.
      </p>

      <Link href="/" className="mt-12 inline-block text-[13px] font-semibold text-gold-deep">
        ← 홈으로
      </Link>
    </div>
  );
}
