"use client";

import { useState } from "react";

interface Notice {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export function NoticeAccordion({ notices }: { notices: Notice[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (notices.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white px-5 py-16 text-center text-stone">
        등록된 공지사항이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      {notices.map((n) => {
        const open = openId === n.id;
        return (
          <div key={n.id} className="border-b border-line last:border-0">
            <button
              onClick={() => setOpenId(open ? null : n.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-mist/40"
            >
              <span className="flex items-center gap-2 text-[13.5px] font-medium">
                {n.is_pinned && (
                  <span className="rounded-full bg-gold px-2 py-0.5 text-[10.5px] font-semibold text-white">
                    고정
                  </span>
                )}
                {n.title}
              </span>
              <span className="text-[11.5px] text-gray-400">
                {new Date(n.created_at).toLocaleDateString("ko-KR")}
              </span>
            </button>
            {open && (
              <div className="border-t border-line bg-mist/30 px-5 py-4 text-[13px] leading-relaxed text-gray-700">
                {n.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
