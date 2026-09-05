import Link from "next/link";

function buildHref(searchParams: Record<string, string | string[] | undefined>, page: number) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "page" || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  });
  params.set("page", String(page));
  return `/search?${params.toString()}`;
}

export function SearchPagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  // 현재 페이지 주변 최대 5개 숫자만 보여줍니다 (전체가 많아도 화면이 길어지지 않도록).
  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5">
      {currentPage > 1 && (
        <Link
          href={buildHref(searchParams, currentPage - 1)}
          className="flex h-9 w-9 items-center justify-center rounded border border-line text-[13px] text-gray-600 hover:border-gold-deep hover:text-gold-deep"
        >
          ‹
        </Link>
      )}

      {start > 1 && (
        <>
          <Link
            href={buildHref(searchParams, 1)}
            className="flex h-9 w-9 items-center justify-center rounded border border-line text-[13px] text-gray-600 hover:border-gold-deep hover:text-gold-deep"
          >
            1
          </Link>
          {start > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(searchParams, p)}
          className={`flex h-9 w-9 items-center justify-center rounded border text-[13px] ${
            p === currentPage
              ? "border-gold bg-gold text-white"
              : "border-line text-gray-600 hover:border-gold-deep hover:text-gold-deep"
          }`}
        >
          {p}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
          <Link
            href={buildHref(searchParams, totalPages)}
            className="flex h-9 w-9 items-center justify-center rounded border border-line text-[13px] text-gray-600 hover:border-gold-deep hover:text-gold-deep"
          >
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages && (
        <Link
          href={buildHref(searchParams, currentPage + 1)}
          className="flex h-9 w-9 items-center justify-center rounded border border-line text-[13px] text-gray-600 hover:border-gold-deep hover:text-gold-deep"
        >
          ›
        </Link>
      )}
    </nav>
  );
}
