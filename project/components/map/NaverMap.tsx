"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    naver: any;
  }
}

export function NaverMap({ lat, lng, title }: { lat: number | null; lng: number | null; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  useEffect(() => {
    if (!scriptLoaded || !window.naver || !containerRef.current || !lat || !lng) return;

    const center = new window.naver.maps.LatLng(lat, lng);
    const map = new window.naver.maps.Map(containerRef.current, {
      center,
      zoom: 16,
    });
    new window.naver.maps.Marker({ position: center, map, title });
  }, [scriptLoaded, lat, lng, title]);

  if (!clientId) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg bg-mist text-center text-[13px] text-stone">
        네이버 지도 API 키가 설정되지 않았습니다.
        <br />
        (.env의 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 확인해주세요)
      </div>
    );
  }

  if (!lat || !lng) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg bg-mist text-[13px] text-stone">
        지도 정보를 준비 중입니다
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} aria-label={`${title} 위치 지도`} className="h-[280px] w-full rounded-lg" />
    </>
  );
}
