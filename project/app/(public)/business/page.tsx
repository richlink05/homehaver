import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "파트너센터 — 분양담당자를 위한 홈해버",
  description:
    "홈해버는 전국 분양정보를 한 곳에 모아 보여주는 검색 플랫폼입니다. 매물을 등록하고, 검색으로 들어온 상담 문의를 바로 받아보세요.",
};

const WHY_ITEMS = [
  {
    n: "1",
    title: "검색으로 유입되는 진짜 리드",
    desc: "지역명·단지명으로 검색해 들어온, 실제로 관심 있는 방문자만 상담 신청으로 이어집니다. 광고비 없이 노출부터 시작하세요.",
  },
  {
    n: "2",
    title: "내 담당 현장은 나만 노출",
    desc: "한 현장에는 한 명의 담당자만 노출됩니다. 여러 담당자가 같은 매물을 두고 경쟁하지 않습니다.",
  },
  {
    n: "3",
    title: "상담 신청은 바로 내 문의함으로",
    desc: "방문자가 남긴 이름·연락처·문의내용이 마이페이지 상담문의함에 실시간으로 쌓입니다.",
  },
];

const STEPS = [
  { n: "1", title: "회원가입", desc: "이메일 인증 후 담당자 정보를 입력하면 가입 신청이 완료됩니다." },
  { n: "2", title: "승인 대기", desc: "관리자 확인 후 승인되면 정식 회원으로 전환됩니다." },
  { n: "3", title: "현장 등록", desc: "담당 현장 정보와 사진을 등록하고 승인을 요청합니다." },
  { n: "4", title: "노출 시작", desc: "승인 후 담당자로 활성화하면 검색결과에 바로 노출됩니다." },
];

const FAQS = [
  {
    q: "가입은 아무나 할 수 있나요?",
    a: "분양 업무를 하시는 분이라면 누구나 가입 신청이 가능합니다. 가입 후 관리자 승인이 완료되어야 이용할 수 있습니다.",
  },
  {
    q: "이미 다른 담당자가 있는 현장도 등록할 수 있나요?",
    a: "네, 현장 정보 자체는 등록할 수 있습니다. 다만 노출은 한 번에 한 담당자에게만 가능해, 기존 담당자가 있다면 대기자로 등록되어 순서를 기다리게 됩니다.",
  },
  {
    q: "포인트는 어떻게 충전하나요?",
    a: "마이페이지 > 포인트관리에서 충전할 수 있습니다. 최소 충전금액은 30,000원입니다.",
  },
  {
    q: "승인은 얼마나 걸리나요?",
    a: "회원가입과 현장 등록 모두 관리자 검토를 거치며, 통상 영업일 기준 1~2일 내 처리됩니다.",
  },
];

export default function BusinessPage() {
  return (
    <div>
      {/* 헤더 (파트너센터 전용 배지만 추가, 로그인/가입 버튼 노출) */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-8 py-5">
          <div className="font-serif text-xl font-semibold">
            Home<span className="text-gold">Haver</span>{" "}
            <span className="text-[11px] font-normal text-stone">파트너센터</span>
          </div>
          <nav className="flex gap-3.5">
            <Link
              href="/login"
              className="rounded-sm border border-ink px-5 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-ink hover:text-white"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-sm bg-gold px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-gold-deep"
            >
              무료로 시작하기
            </Link>
          </nav>
        </div>
      </header>

      {/* 히어로 */}
      <section className="bg-gradient-to-b from-[#FBF8F1] to-white px-6 py-24 text-center">
        <p className="mb-4 text-xs font-bold tracking-[3px] text-gold-deep">
          홈해버 분양담당자 파트너센터
        </p>
        <h1 className="mx-auto mb-5 max-w-[720px] font-serif text-[32px] font-bold leading-snug md:text-[44px]">
          내 현장을 찾는 사람들에게
          <br />
          <span className="text-gold-deep">가장 먼저</span> 보여지는 방법
        </h1>
        <p className="mx-auto mb-9 max-w-[560px] text-[16px] text-gray-600">
          홈해버는 전국 분양정보를 한 곳에 모아 보여주는 검색 플랫폼입니다.
          <br />
          매물을 등록하고, 검색으로 들어온 상담 문의를 바로 받아보세요.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-sm bg-gold px-7 py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-gold-deep"
          >
            무료 회원가입
          </Link>
          <Link
            href="/login"
            className="rounded-sm border border-ink px-7 py-3.5 text-[14.5px] font-semibold transition-colors hover:bg-ink hover:text-white"
          >
            이미 계정이 있어요
          </Link>
        </div>
      </section>

      {/* 신뢰 배지 */}
      <div className="flex flex-wrap justify-center gap-9 border-y border-line bg-mist py-6">
        <div className="text-center">
          <p className="font-serif text-[24px] font-bold text-gold-deep">전국</p>
          <p className="mt-0.5 text-xs text-stone">지역 제한 없는 매물 등록</p>
        </div>
        <div className="text-center">
          <p className="font-serif text-[24px] font-bold text-gold-deep">1일 1건</p>
          <p className="mt-0.5 text-xs text-stone">한 현장, 한 담당자 원칙</p>
        </div>
        <div className="text-center">
          <p className="font-serif text-[24px] font-bold text-gold-deep">무료</p>
          <p className="mt-0.5 text-xs text-stone">회원가입 · 매물 등록비</p>
        </div>
      </div>

      {/* 왜 홈해버인가 */}
      <section className="mx-auto max-w-[1080px] px-8 py-20">
        <div className="mx-auto mb-12 max-w-[600px] text-center">
          <p className="mb-3 text-xs font-bold tracking-[2px] text-gold-deep">WHY HOMEHAVER</p>
          <h2 className="text-[28px] font-bold">왜 홈해버에 등록해야 할까요</h2>
          <p className="mt-3 text-[14.5px] text-stone">분양 상담이 필요한 사람은 언제나 검색부터 시작합니다.</p>
        </div>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
          {WHY_ITEMS.map((item) => (
            <div
              key={item.n}
              className="rounded-md border border-line p-8 transition-all hover:-translate-y-0.5 hover:border-gold-soft hover:shadow-[0_12px_30px_rgba(17,17,17,0.06)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gold text-[18px] font-bold text-white">
                {item.n}
              </div>
              <h3 className="mb-2.5 text-[16.5px] font-bold">{item.title}</h3>
              <p className="text-[13.5px] text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 이용 방법 */}
      <section className="bg-mist px-8 py-20">
        <div className="mx-auto max-w-[1080px]">
          <div className="mx-auto mb-12 max-w-[600px] text-center">
            <p className="mb-3 text-xs font-bold tracking-[2px] text-gold-deep">HOW IT WORKS</p>
            <h2 className="text-[28px] font-bold">시작하는 방법</h2>
          </div>
          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-line md:block" />
            {STEPS.map((step) => (
              <div key={step.n} className="relative px-3.5 text-center">
                <div className="relative z-10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold bg-white font-serif text-[19px] font-bold text-gold-deep">
                  {step.n}
                </div>
                <h4 className="mb-2 text-[14.5px] font-bold">{step.title}</h4>
                <p className="text-[12.5px] text-stone">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 요금 안내 */}
      <section className="mx-auto max-w-[1080px] px-8 py-20">
        <div className="mx-auto mb-12 max-w-[600px] text-center">
          <p className="mb-3 text-xs font-bold tracking-[2px] text-gold-deep">PRICING</p>
          <h2 className="text-[28px] font-bold">이용 요금 안내</h2>
          <p className="mt-3 text-[14.5px] text-stone">
            광고비가 아니라, 노출된 일수만큼만 부담하는 포인트 방식입니다.
          </p>
        </div>
        <div className="mx-auto max-w-[640px] overflow-hidden rounded-lg border border-line">
          <div className="bg-ink px-8 py-8 text-center text-white">
            <p className="font-serif text-[38px] font-bold text-gold-soft">
              15,000P <span className="text-[15px] font-normal text-gray-300">/ 일</span>
            </p>
            <p className="mt-1.5 text-[12.5px] text-gray-300">
              노출 중인 현장 1건 기준, 하루 단위로 자동 차감됩니다
            </p>
          </div>
          <ul className="px-8 py-7">
            {[
              "1P = 1원, 최소 충전금액 30,000원",
              "포인트가 있는 동안에만 노출되며, 소진 시 대기자에게 자동 인계",
              '담당 현장은 언제든지 "광고 그만하기"로 중단 가능',
              "이미 담당자가 있는 현장은 대기자로 등록해 순서를 기다릴 수 있음",
            ].map((text) => (
              <li
                key={text}
                className="flex gap-2.5 border-b border-line py-2.5 text-[13.5px] last:border-0"
              >
                <span className="font-bold text-gold-deep">✓</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[700px] px-8 py-20">
        <div className="mx-auto mb-12 text-center">
          <p className="mb-3 text-xs font-bold tracking-[2px] text-gold-deep">FAQ</p>
          <h2 className="text-[28px] font-bold">자주 묻는 질문</h2>
        </div>
        {FAQS.map((faq) => (
          <div key={faq.q} className="border-b border-line py-5 last:border-0">
            <h4 className="mb-2 text-[14.5px] font-bold">{faq.q}</h4>
            <p className="text-[13.5px] text-gray-600">{faq.a}</p>
          </div>
        ))}
      </section>

      {/* 하단 CTA */}
      <section className="bg-gradient-to-br from-[#1a1a1a] to-[#2b2620] px-8 py-24 text-center text-white">
        <h2 className="mb-3.5 font-serif text-[28px] font-bold">지금 바로 시작해보세요</h2>
        <p className="mb-8 text-[14.5px] text-gray-300">가입은 무료입니다. 첫 현장은 오늘 등록할 수 있습니다.</p>
        <Link
          href="/signup"
          className="inline-block rounded-sm bg-gold px-9 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-gold-deep"
        >
          무료 회원가입
        </Link>
      </section>

      <footer className="py-7 text-center text-xs text-stone">© 2026 HomeHaver. (주)리치디앤씨</footer>
    </div>
  );
}
