import { SearchBar } from "@/components/search/SearchBar";

export const dynamic = "force-dynamic";


const POPULAR_KEYWORDS = ["강남", "송도", "용인", "수원", "동탄", "부산", "세종"];

export default function HomePage() {
  return (
    <section className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-6 pb-24 text-center">
      <p className="mb-5 text-xs font-semibold tracking-[4px] text-gold-deep">
        RICHLINK · PREMIUM 분양 검색 플랫폼
      </p>
      <h1 className="mb-12 font-serif text-3xl font-semibold leading-snug md:text-[44px]">
        대한민국 분양의
        <br />
        모든 정보를 <em className="italic text-gold">연결</em>하다.
      </h1>

      <div className="w-full max-w-[680px]">
        <SearchBar size="large" />
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <span className="mr-1 text-[13px] text-stone">인기 검색어</span>
          {POPULAR_KEYWORDS.map((kw) => (
            <a
              key={kw}
              href={`/search?q=${encodeURIComponent(kw)}`}
              className="rounded-full border border-line px-4 py-1.5 text-[13px] text-gray-700 transition-colors hover:border-gold hover:bg-[#FBF7EE] hover:text-gold-deep"
            >
              {kw}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
