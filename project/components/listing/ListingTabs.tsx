"use client";

import { useState, type ReactNode } from "react";

interface TabItem {
  key: string;
  label: string;
  content: ReactNode;
}

export function ListingTabs({ tabs }: { tabs: TabItem[] }) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div>
      <div className="mb-7 flex border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`border-b-2 px-5 py-3 text-sm transition-colors ${
              active === tab.key
                ? "border-gold font-semibold text-ink"
                : "border-transparent text-stone hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="text-[14.5px] leading-[1.9] text-gray-700">
        {tabs.find((t) => t.key === active)?.content}
      </div>
    </div>
  );
}
