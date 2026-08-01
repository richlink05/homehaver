# RichLink ERD

```mermaid
erDiagram
  PROFILES ||--o{ LISTINGS : "등록(분양관계자)"
  PROFILES ||--o{ INQUIRIES : "상담신청"
  PROFILES ||--o{ FAVORITES : "찜하기"
  PROFILES ||--o{ REVIEWS : "작성"
  PROFILES ||--o{ RECENT_VIEWS : "조회기록"
  LISTINGS ||--o{ LISTING_IMAGES : "이미지"
  LISTINGS ||--o{ LISTING_UNITS : "타입/평형"
  LISTINGS ||--o{ INQUIRIES : "문의대상"
  LISTINGS ||--o{ FAVORITES : "찜대상"
  LISTINGS ||--o{ REVIEWS : "후기대상"
  LISTINGS ||--o{ RECENT_VIEWS : "조회대상"
  LISTINGS }o--|| REGIONS : "소속지역"
  LISTINGS }o--|| BUILDERS : "시공사"
  ADMIN_BANNERS }o--|| PROFILES : "등록자"
  ADMIN_NOTICES }o--|| PROFILES : "등록자"

  PROFILES {
    uuid id PK
    text role "user | agency | admin"
    text name
    text phone
    text email
    text company_name
    timestamptz created_at
  }

  REGIONS {
    uuid id PK
    text sido
    text sigungu
    text dong
  }

  BUILDERS {
    uuid id PK
    text name
    text brand_name
    text logo_url
  }

  LISTINGS {
    uuid id PK
    uuid agency_id FK
    uuid region_id FK
    uuid builder_id FK
    text title
    text type "아파트|오피스텔|지식산업센터|상가"
    text status "분양예정|분양중|계약중|마감"
    numeric price_min
    numeric price_max
    date move_in_date
    text address
    numeric lat
    numeric lng
    text description
    int view_count
    int like_count
    bool is_approved
    timestamptz created_at
    timestamptz updated_at
  }

  LISTING_IMAGES {
    uuid id PK
    uuid listing_id FK
    text image_url
    text category "대표|평면도|배치도|영상"
    int sort_order
  }

  LISTING_UNITS {
    uuid id PK
    uuid listing_id FK
    text unit_type "84A|101 등"
    numeric exclusive_area
    numeric supply_area
    text plan_image_url
  }

  INQUIRIES {
    uuid id PK
    uuid listing_id FK
    uuid user_id FK
    text name
    text phone
    text message
    text status "대기|응답완료"
    timestamptz created_at
  }

  FAVORITES {
    uuid id PK
    uuid listing_id FK
    uuid user_id FK
    timestamptz created_at
  }

  REVIEWS {
    uuid id PK
    uuid listing_id FK
    uuid user_id FK
    text content
    int rating
    timestamptz created_at
  }

  RECENT_VIEWS {
    uuid id PK
    uuid listing_id FK
    uuid user_id FK
    timestamptz viewed_at
  }

  ADMIN_BANNERS {
    uuid id PK
    text image_url
    text link_url
    int sort_order
    bool is_active
    uuid created_by FK
  }

  ADMIN_NOTICES {
    uuid id PK
    text title
    text content
    bool is_pinned
    uuid created_by FK
  }
```

## 설계 노트

- `profiles.role`로 일반회원/분양관계자/관리자를 구분하고, Supabase Auth의 `auth.users`와 1:1로 연결됩니다.
- `listings.is_approved`는 분양관계자가 등록한 매물이 관리자 승인을 거쳐야 노출되도록 하는 플래그입니다.
- 검색 성능을 위해 `listings(title, address)`에 PostgreSQL `pg_trgm` 기반 인덱스를, 인기 검색어 집계를 위해 별도 `search_logs` 테이블(선택)을 둘 수 있습니다.
- 지도 좌표(`lat`, `lng`)는 등록 시 카카오/네이버 지오코딩 API로 변환하여 저장합니다.
