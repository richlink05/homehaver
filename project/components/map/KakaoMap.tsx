"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    kakao: any;
  }
}

export function KakaoMap({ lat, lng, title }: { lat: number | null; lng: number | null; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  // 다른 매물 상세페이지에서 이미 카카오맵 스크립트를 불러온 적이 있으면,
  // 브라우저에 스크립트가 이미 로드되어 있어서 <Script>의 onLoad가 다시 안 뜁니다.
  // 그래서 마운트 시점에 window.kakao가 이미 존재하는지 직접 확인합니다.
  useEffect(() => {
    if (window.kakao?.maps) {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.kakao || !containerRef.current || !lat || !lng) return;

    try {
      window.kakao.maps.load(() => {
        try {
          const center = new window.kakao.maps.LatLng(lat, lng);
          const map = new window.kakao.maps.Map(containerRef.current, { center, level: 3 });
          const marker = new window.kakao.maps.Marker({ position: center });
          marker.setMap(map);
        } catch (e: any) {
          console.error("카카오맵 초기화 실패:", e, { lat, lng });
          setMapError(e?.message ?? "지도를 표시하는 중 오류가 발생했습니다.");
        }
      });
    } catch (e: any) {
      console.error("카카오맵 SDK 로드 실패:", e);
      setMapError(e?.message ?? "지도 SDK를 불러오지 못했습니다.");
    }
  }, [scriptLoaded, lat, lng]);

  if (!appKey) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg bg-mist text-center text-[13px] text-stone">
        카카오맵 API 키가 설정되지 않았습니다.
        <br />
        (.env의 NEXT_PUBLIC_KAKAO_MAP_KEY를 확인해주세요)
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

  if (mapError) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center gap-1.5 rounded-lg bg-mist text-center text-[13px] text-stone">
        <span>지도를 불러오지 못했습니다.</span>
        <span className="text-[11px] text-red-500">{mapError}</span>
        <span className="text-[11px] text-gray-400">
          좌표값: {lat}, {lng}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* autoload=false로 불러온 뒤 kakao.maps.load()로 직접 초기화 시점을 제어합니다. */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setMapError("지도 스크립트 로드에 실패했습니다. (도메인 등록 여부를 확인해주세요)")}
      />
      <div ref={containerRef} aria-label={`${title} 위치 지도`} className="h-[280px] w-full rounded-lg" />
    </>
  );
}
