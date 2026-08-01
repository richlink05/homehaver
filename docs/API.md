# RichLink API 설계 (Next.js Route Handlers)

## 검색

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/search?q=강남&type=아파트&status=분양중&page=1` | 통합 검색 (지역명/분양명, 오타보정 포함) |
| GET | `/api/search/autocomplete?q=강` | 실시간 자동완성 |
| GET | `/api/search/popular` | 인기 검색어 (집계 기반) |

## 분양 매물

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/listings` | 목록 조회 (필터/정렬/페이지네이션) |
| GET | `/api/listings/[id]` | 상세 조회 (조회수 증가 트리거 포함) |
| POST | `/api/listings` | 등록 (분양관계자, `is_approved=false`로 생성) |
| PATCH | `/api/listings/[id]` | 수정 (본인 소유만) |
| DELETE | `/api/listings/[id]` | 삭제 |

## 문의 / 찜하기 / 후기

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/inquiries` | 상담신청 등록 |
| GET | `/api/inquiries?listing_id=` | 분양관계자용 문의 목록 |
| PATCH | `/api/inquiries/[id]` | 상담 상태 변경(응답완료) |
| POST | `/api/favorites` | 찜하기 토글 |
| GET | `/api/favorites` | 내 찜 목록 |
| POST | `/api/reviews` | 후기 작성 |

## AI 기능

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/ai/recommend` | 검색어 추천 / 유사현장 추천 / 관심지역 추천 |
| POST | `/api/ai/summarize` | 분양 상세정보 AI 요약 |

## 관리자

| 메서드 | 경로 | 설명 |
|---|---|---|
| PATCH | `/api/admin/listings/[id]/approve` | 분양 승인 |
| GET/PATCH | `/api/admin/users` | 회원 관리 |
| CRUD | `/api/admin/banners` | 배너 관리 |
| CRUD | `/api/admin/notices` | 공지사항 |
| CRUD | `/api/admin/popups` | 팝업 관리 |

모든 쓰기(POST/PATCH/DELETE) 요청은 Supabase Auth 세션 쿠키를 검증하고, `profiles.role`에 따라 접근을 제한합니다. 응답 포맷은 `{ data, error }` 구조로 통일합니다.
