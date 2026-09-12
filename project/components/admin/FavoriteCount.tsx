"use client";

import { useState } from "react";

interface FavoriteEntry {
  name: string | null;
  email: string | null;
  created_at: string;
}

export function FavoriteCount({ favorites }: { favorites: FavoriteEntry[] }) {
  const [open, setOpen] = useState(false);

  if (favorites.length === 0) {
    return <span className="text-gray-400">0명</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-gold/15 px-2.5 py-1 text-[12px] font-semibold text-gold-deep hover:bg-gold/25"
      >
        {favorites.length}명
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-[380px] rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">즐겨찾기한 분양담당자 ({favorites.length}명)</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-ink">
                ✕
              </button>
            </div>
            <div className="max-h-[360px] space-y-2 overflow-y-auto">
              {favorites.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-line px-3.5 py-2.5">
                  <div>
                    <p className="text-[13px] font-medium">{f.name ?? "-"}</p>
                    <p className="text-[11.5px] text-gray-500">{f.email ?? "-"}</p>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {new Date(f.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
