"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const REGIONS = ["서울", "경기", "인천", "부산"];
const TYPES = ["아파트", "오피스텔", "지식산업센터", "상가"];
const STATUSES = ["분양예정", "분양중", "계약중"];
const MOVE_IN_YEARS = ["2026", "2027", "2028+"];

function FilterGroup({
  title,
  options,
  paramKey,
}: {
  title: string;
  options: string[];
  paramKey: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.getAll(paramKey);

  const toggle = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(paramKey);
    params.delete(paramKey);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    next.forEach((v) => params.append(paramKey, v));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-7">
      <h4 className="mb-3.5 text-[13px] font-semibold">{title}</h4>
      {options.map((opt) => (
        <label key={opt} className="mb-2.5 flex cursor-pointer items-center gap-2 text-[13.5px] text-gray-600 hover:text-gold-deep">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="h-3.5 w-3.5 accent-gold"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

export function ListingFilter() {
  return (
    <aside className="border-r border-line pr-8">
      <FilterGroup title="지역" options={REGIONS} paramKey="region" />
      <FilterGroup title="분양종류" options={TYPES} paramKey="type" />
      <FilterGroup title="분양상태" options={STATUSES} paramKey="status" />
      <FilterGroup title="입주예정" options={MOVE_IN_YEARS} paramKey="moveIn" />
    </aside>
  );
}
