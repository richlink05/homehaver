-- ============================================================
-- RichLink Supabase Schema
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ---------- PROFILES ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','agency','admin')),
  name text,
  phone text,
  email text,
  company_name text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- REGIONS / BUILDERS ----------
create table regions (
  id uuid primary key default uuid_generate_v4(),
  sido text not null,
  sigungu text,
  dong text
);

create table builders (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  brand_name text,
  logo_url text
);

-- ---------- LISTINGS ----------
create table listings (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid references profiles(id) on delete set null,
  region_id uuid references regions(id),
  builder_id uuid references builders(id),
  title text not null,
  type text not null check (type in ('아파트','오피스텔')),
  status text not null default '분양예정' check (status in ('분양예정','분양중','마감')),
  price_min numeric,
  price_max numeric,
  area_min numeric,
  area_max numeric,
  unit_count int,
  building_count int,
  top_floor int,
  move_in_date date,
  address text,
  lat numeric,
  lng numeric,
  description text,
  thumbnail_url text,
  manager_name text,
  manager_phone text,
  view_count int not null default 0,
  like_count int not null default 0,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_listings_title_trgm on listings using gin (title gin_trgm_ops);
create index idx_listings_address_trgm on listings using gin (address gin_trgm_ops);
create index idx_listings_status on listings (status);
create index idx_listings_type on listings (type);

create table listing_images (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  image_url text not null,
  category text check (category in ('썸네일','평면도','인프라')),
  sort_order int default 0
);

create table listing_units (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  unit_type text not null,
  exclusive_area numeric,
  supply_area numeric,
  plan_image_url text
);

-- ---------- INQUIRIES / FAVORITES / REVIEWS / RECENT VIEWS ----------
create table inquiries (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  user_id uuid references profiles(id),
  name text not null,
  phone text not null,
  message text,
  status text not null default '대기' check (status in ('대기','응답완료')),
  created_at timestamptz not null default now()
);

create table favorites (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  user_id uuid references profiles(id),
  content text not null,
  rating int check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table recent_views (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

-- ---------- ADMIN ----------
create table admin_banners (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  link_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_by uuid references profiles(id)
);

create table admin_notices (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  is_pinned boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table listings enable row level security;
alter table builders enable row level security;
alter table regions enable row level security;
alter table listing_images enable row level security;
alter table inquiries enable row level security;
alter table favorites enable row level security;
alter table reviews enable row level security;

-- 누구나 승인된 매물 조회 가능
create policy "listings_public_read" on listings
  for select using (is_approved = true or agency_id = auth.uid());

-- 분양관계자 본인 매물만 등록/수정 (관리자 승인이 완료된 담당자만 등록 가능)
create policy "listings_agency_insert" on listings
  for insert with check (
    auth.uid() = agency_id
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_approved = true)
  );

create policy "listings_agency_update" on listings
  for update using (auth.uid() = agency_id);

-- 시공사/지역은 누구나 조회 가능, 로그인한 사용자는 새 시공사를 등록(upsert) 가능
create policy "builders_public_read" on builders for select using (true);
create policy "builders_authenticated_write" on builders
  for insert with check (auth.uid() is not null);
create policy "builders_authenticated_update" on builders
  for update using (auth.uid() is not null);

create policy "regions_public_read" on regions for select using (true);

-- 매물 이미지는 누구나 조회 가능, 해당 매물의 담당자만 등록/수정/삭제 가능
create policy "listing_images_public_read" on listing_images for select using (true);
create policy "listing_images_owner_write" on listing_images
  for all using (
    exists (select 1 from listings l where l.id = listing_images.listing_id and l.agency_id = auth.uid())
  );

-- 본인 프로필 생성(회원가입 시 1회) / 조회 / 수정
create policy "profiles_self_insert" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_self_select" on profiles
  for select using (auth.uid() = id);

create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id);

-- 관리자는 모든 프로필/매물을 관리 가능
-- 관리자 여부 확인용 함수 (security definer로 RLS를 우회해서 조회하므로,
-- 이 함수를 정책 안에서 써도 "profiles 정책이 다시 profiles를 조회하는" 재귀가 생기지 않습니다.)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_admin_all" on profiles
  for all using (is_admin());

create policy "listings_admin_all" on listings
  for all using (is_admin());

alter table admin_banners enable row level security;
alter table admin_notices enable row level security;

create policy "banners_public_read" on admin_banners for select using (true);
create policy "banners_admin_write" on admin_banners
  for all using (is_admin());

create policy "notices_public_read" on admin_notices for select using (true);
create policy "notices_admin_write" on admin_notices
  for all using (is_admin());

-- 상담신청(inquiries): 등록은 비회원 포함 누구나 가능해야 합니다(핵심 리드 채널).
-- 조회/수정은 신청자 본인(로그인한 경우), 해당 매물 담당자, 관리자만 가능합니다.
create policy "inquiries_public_insert" on inquiries
  for insert with check (true);

create policy "inquiries_owner_select" on inquiries
  for select using (
    auth.uid() = user_id
    or exists (select 1 from listings l where l.id = listing_id and l.agency_id = auth.uid())
    or is_admin()
  );

create policy "inquiries_owner_update" on inquiries
  for update using (
    exists (select 1 from listings l where l.id = listing_id and l.agency_id = auth.uid())
    or is_admin()
  );

create policy "favorites_owner" on favorites
  for all using (auth.uid() = user_id);

create policy "reviews_read_all" on reviews for select using (true);
create policy "reviews_owner_write" on reviews for insert with check (auth.uid() = user_id);

-- 위의 RLS 정책들이 실제로 적용되려면, 그 전 단계로 anon/authenticated 역할이
-- 테이블 자체에 접근할 수 있는 기본 권한(GRANT)이 먼저 있어야 합니다.
-- (RLS는 "어떤 행을 볼 수 있는지"만 제어하고, "테이블에 접근 가능한지"는 GRANT가 결정합니다.)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
-- 비회원도 상담신청은 등록할 수 있어야 하므로 inquiries 테이블만 별도로 insert 권한을 추가로 부여합니다.
grant insert on inquiries to anon;
grant execute on all functions in schema public to anon, authenticated;

-- ============================================================
-- Storage (분양 이미지 업로드)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "listing_images_public_read" on storage.objects
  for select using (bucket_id = 'listing-images');

create policy "listing_images_agency_upload" on storage.objects
  for insert with check (
    bucket_id = 'listing-images' and auth.role() = 'authenticated'
  );
create or replace function increment_view_count(listing_id uuid)
returns void as $$
  update listings set view_count = view_count + 1 where id = listing_id;
$$ language sql security definer;

-- ============================================================
-- 최초 관리자 계정 안내
-- ============================================================
-- 신규 가입자는 기본적으로 is_approved = false 상태입니다.
-- 최초 관리자 계정은 가입 후 아래처럼 직접 승인/역할 지정이 필요합니다:
--   update profiles set role = 'admin', is_approved = true where email = '<admin-email>';
