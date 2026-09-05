"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const REGIONS = ["서울", "경기", "인천", "부산"];
const TYPES = ["아파트", "오피스텔", "생활형숙박시설", "지식산업센터", "상가"];
const STATUSES = ["분양예정", "분양중", "마감"];

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
  // 모바일(860px 이하)에서는 기본적으로 접혀있고, 버튼을 눌러야 펼쳐집니다.
  // 데스크탑에서는 이 상태와 무관하게 항상 보이도록 CSS로 처리합니다.
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchParams = useSearchParams();
  const activeCount =
    searchParams.getAll("region").length + searchParams.getAll("type").length + searchParams.getAll("status").length;

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="mb-4 flex w-full items-center justify-between rounded border border-line px-4 py-3 text-[13.5px] font-medium min-[861px]:hidden"
      >
        <span className="flex items-center gap-2">
          {/* 햄버거 아이콘 */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          필터
          {activeCount > 0 && (
            <span className="rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <span className="text-gray-400">{mobileOpen ? "닫기 ▲" : "펼치기 ▼"}</span>
      </button>

      <aside
        className={`border-line pr-8 min-[861px]:block min-[861px]:border-r ${mobileOpen ? "block" : "hidden"}`}
      >
        <FilterGroup title="지역" options={REGIONS} paramKey="region" />
        <FilterGroup title="분양종류" options={TYPES} paramKey="type" />
        <FilterGroup title="분양상태" options={STATUSES} paramKey="status" />
      </aside>
    </>
  );
}
