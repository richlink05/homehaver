"use client";

import { useRouter } from "next/navigation";
import { useState, KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  size?: "large" | "default";
  initialValue?: string;
  className?: string;
}

export function SearchBar({ size = "default", initialValue = "", className }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [focused, setFocused] = useState(false);

  const handleSearch = () => {
    if (!value.trim()) return;
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const isLarge = size === "large";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border-[1.5px] border-line bg-white transition-all duration-300",
        focused && "border-gold shadow-[0_0_0_4px_rgba(200,160,68,0.14),0_8px_30px_rgba(200,160,68,0.12)]",
        isLarge ? "py-2 pl-7 pr-2" : "py-1 pl-4 pr-1",
        className
      )}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder="지역명 또는 분양명을 검색해보세요"
        className={cn(
          "flex-1 bg-transparent outline-none placeholder:text-stone/70",
          isLarge ? "py-3 text-[17px]" : "py-2 text-sm"
        )}
      />
      <button
        onClick={handleSearch}
        aria-label="검색"
        className={cn(
          "flex flex-shrink-0 items-center justify-center rounded-full bg-gold text-white transition-colors hover:bg-gold-deep",
          isLarge ? "h-[46px] w-[46px]" : "h-9 w-9"
        )}
      >
        <Search size={isLarge ? 18 : 14} strokeWidth={2.2} />
      </button>
    </div>
  );
}
