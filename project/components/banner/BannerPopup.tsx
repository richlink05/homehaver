"use client";

import { useEffect, useState } from "react";

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
}

const HIDE_KEY = "richlink_banner_popup_hide_until";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function BannerPopup({ banners }: { banners: Banner[] }) {
  const [open, setOpen] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    if (banners.length === 0) return;
    const hideUntil = localStorage.getItem(HIDE_KEY);
    if (hideUntil === todayStr()) return;
    setOpen(true);
  }, [banners]);

  const close = () => {
    if (hideToday) {
      localStorage.setItem(HIDE_KEY, todayStr());
    }
    setOpen(false);
  };

  if (!open || banners.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-[420px] overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="max-h-[70vh] overflow-y-auto">
          {banners.map((b) =>
            b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image_url} alt="배너" className="block h-[280px] w-full object-cover" />
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={b.id} src={b.image_url} alt="배너" className="block h-[280px] w-full object-cover" />
            )
          )}
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-gray-600">
            <input type="checkbox" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} />
            오늘 하루 열지 않기
          </label>
          <button
            onClick={close}
            className="rounded bg-ink px-4 py-1.5 text-[12.5px] font-semibold text-white"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
