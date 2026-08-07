import Link from "next/link";

export function WriteButton() {
  return (
    <Link
      href="/community/write"
      className="rounded bg-gold px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-gold-deep"
    >
      + 글쓰기
    </Link>
  );
}
