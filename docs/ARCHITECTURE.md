# RichLink 아키텍처 설계

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 14 (App Router, RSC + SSR) |
| 언어 | TypeScript |
| 스타일링 | TailwindCSS + shadcn/ui |
| 상태/데이터 | React Query (서버 상태), Zustand (클라이언트 상태) |
| 폼 | React Hook Form + Zod |
| DB / Auth / Storage | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| 지도 | 카카오맵 SDK, 네이버지도 SDK |
| 애니메이션 | Framer Motion |
| 배포 | Vercel (프론트) + Supabase Cloud (백엔드) |

## 폴더 구조

```
richlink/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                     # 홈 (검색 메인)
│   │   ├── search/
│   │   │   └── page.tsx                 # 검색 결과 페이지
│   │   ├── listing/
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # 분양 상세 페이지
│   │   │       └── loading.tsx
│   │   └── layout.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (member)/
│   │   ├── mypage/
│   │   │   ├── page.tsx                 # 마이페이지 (일반회원)
│   │   │   ├── favorites/page.tsx       # 찜한 분양
│   │   │   └── recent/page.tsx          # 최근 본 현장
│   │   └── layout.tsx
│   ├── (agency)/                        # 분양관계자 전용
│   │   ├── listings/
│   │   │   ├── page.tsx                 # 분양 등록 목록
│   │   │   ├── new/page.tsx             # 분양 등록
│   │   │   └── [id]/edit/page.tsx       # 분양 수정
│   │   ├── inquiries/page.tsx           # 문의 관리
│   │   ├── leads/page.tsx               # DB 관리
│   │   └── stats/page.tsx               # 통계
│   ├── (admin)/                         # 관리자 전용
│   │   ├── approvals/page.tsx           # 분양 승인
│   │   ├── users/page.tsx               # 회원관리
│   │   ├── ads/page.tsx                 # 광고관리
│   │   ├── banners/page.tsx             # 배너관리
│   │   ├── notices/page.tsx             # 공지사항
│   │   └── popups/page.tsx              # 팝업관리
│   ├── api/
│   │   ├── search/route.ts
│   │   ├── listings/route.ts
│   │   ├── listings/[id]/route.ts
│   │   ├── inquiries/route.ts
│   │   ├── favorites/route.ts
│   │   ├── ai/recommend/route.ts
│   │   └── ai/summarize/route.ts
│   └── layout.tsx
│
├── components/
│   ├── ui/                              # shadcn/ui 기반 원자 컴포넌트
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── AutoComplete.tsx
│   │   └── PopularKeywords.tsx
│   ├── listing/
│   │   ├── ListingCard.tsx
│   │   ├── ListingGrid.tsx
│   │   ├── ListingFilter.tsx
│   │   ├── ListingGallery.tsx
│   │   ├── ListingInfoRow.tsx
│   │   └── ListingTabs.tsx
│   ├── consult/
│   │   └── ConsultForm.tsx
│   ├── map/
│   │   ├── KakaoMap.tsx
│   │   └── NaverMap.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # 브라우저 클라이언트
│   │   ├── server.ts                    # 서버 클라이언트 (RSC/Route Handler)
│   │   └── middleware.ts
│   ├── validators/                      # Zod 스키마
│   │   ├── listing.schema.ts
│   │   └── inquiry.schema.ts
│   └── utils.ts
│
├── hooks/
│   ├── useSearchListings.ts
│   ├── useFavorite.ts
│   └── useDebounce.ts
│
├── types/
│   └── database.types.ts                # Supabase 자동 생성 타입
│
├── supabase/
│   ├── migrations/
│   └── schema.sql
│
└── public/
```

## 회원 등급 및 권한

**RichLink 회원가입은 분양담당자(분양관계자) 전용입니다.** 집을 찾는 일반 고객은 별도 가입 없이 검색·열람·상담신청을 이용하며, 상담신청 시 입력한 이름/연락처만으로 문의가 접수됩니다.

| 등급 | 권한 |
|---|---|
| 고객(비회원) | 검색, 열람, 상담신청 (계정 불필요) |
| 분양담당자 | 분양등록/수정, **내가 등록한 현장으로 접수된 상담신청 확인(문의관리)**, 통계 |
| 관리자 | 분양승인, 회원관리, 광고/배너/공지/팝업 관리 |

상담신청(`inquiries`)은 `listing_id`로 매물과 연결되며, 매물은 `agency_id`로 등록 담당자와 연결됩니다. 따라서 담당자는 `/inquiries`(문의관리) 페이지에서 **본인이 등록한 현장으로 들어온 문의만** 조회·응답 처리할 수 있습니다 (RLS: `inquiries` 정책이 `listings.agency_id = auth.uid()`인 경우를 허용).

Supabase Row Level Security(RLS)로 역할별 접근 제어를 구현하며, `profiles.role` 컬럼(`agency` / `admin`, 필요 시 `user`)을 기준으로 정책을 분리합니다.
