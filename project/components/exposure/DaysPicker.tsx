"use client";

import { EXPOSURE_DAY_OPTIONS, exposurePrice, formatWon } from "@/lib/exposure";

// 노출 기간(1·3·7·10일)을 고르는 선택 박스입니다.
export function DaysPicker({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {EXPOSURE_DAY_OPTIONS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={`rounded border px-1 py-2.5 text-center transition-colors ${
            value === d ? "border-ink bg-ink text-white" : "border-line text-gray-600 hover:border-gold-deep"
          }`}
        >
          <span className="block text-[14px] font-semibold">{d}일</span>
          <span className={`block text-[11px] ${value === d ? "text-gray-300" : "text-stone"}`}>
            {formatWon(exposurePrice(d))}
          </span>
        </button>
      ))}
    </div>
  );
}
