"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

export function KakaoMap({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.kakao || !containerRef.current) return;
    window.kakao.maps.load(() => {
      const map = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3,
      });
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
      });
      marker.setMap(map);
    });
  }, [lat, lng]);

  if (!lat || !lng) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg bg-mist text-[13px] text-stone">
        지도 정보를 준비 중입니다
      </div>
    );
  }

  return <div ref={containerRef} aria-label={`${title} 위치 지도`} className="h-[280px] w-full rounded-lg" />;
}
