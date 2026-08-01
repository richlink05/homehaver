"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "recommend", label: "추천순" },
  { value: "recent", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "views", label: "조회순" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      defaultValue={searchParams.get("sort") ?? "recommend"}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded border border-line bg-white px-3.5 py-2 text-[13px] text-gray-600"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
