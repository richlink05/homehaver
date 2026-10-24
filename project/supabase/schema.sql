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
  points integer not null default 0,
  banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- 포인트 거래내역 (충전/사용/환불) ----------
create table point_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null check (type in ('충전','사용','환불')),
  amount integer not null, -- 충전/환불은 양수, 사용은 음수로 저장합니다.
  note text,
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create index idx_point_transactions_user on point_transactions (user_id, created_at desc);

-- 포인트 적립/차감은 반드시 이 함수를 통해서만 이루어집니다.
-- security definer로 실행되어 profiles.points 갱신과 거래내역 insert가 하나의 트랜잭션으로
-- 원자적으로 처리되고(중간에 실패해도 잔액과 내역이 어긋나지 않음), 항상 auth.uid() 본인 계정만
-- 조작하도록 되어있어 다른 사람 포인트를 건드릴 수 없습니다.
create or replace function add_points(p_amount integer, p_type text, p_note text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if p_type not in ('충전','사용','환불') then
    raise exception '알 수 없는 포인트 거래 유형입니다.';
  end if;

  -- 위에서 만든 보호 트리거를 통과시키기 위한 신뢰 플래그(이 트랜잭션에서만 유효).
  perform set_config('app.trusted_profile_update', 'true', true);

  update profiles set points = points + p_amount where id = auth.uid()
  returning points into new_balance;

  if new_balance < 0 then
    raise exception '포인트가 부족합니다.';
  end if;

  insert into point_transactions (user_id, type, amount, note, balance_after)
  values (auth.uid(), p_type, p_amount, p_note, new_balance);

  return new_balance;
end;
$$;
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
  -- 검색결과에서 담당자 있는 현장을 먼저 보여주기 위한 계산 컬럼입니다.
  -- agency_id가 바뀔 때마다 자동으로 true/false가 갱신됩니다.
  is_managed boolean generated always as (agency_id is not null) stored,
  region_id uuid references regions(id),
  builder_id uuid references builders(id),
  title text not null,
  type text not null check (type in ('아파트','오피스텔','생활형숙박시설','지식산업센터','상가')),
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
  -- 등록자가 실제 현장 근무자인지 확인하기 위한 검증서류 (Storage 비공개 버킷 내 경로)
  work_agreement_path text,
  business_card_path text,
  view_count int not null default 0,
  like_count int not null default 0,
  is_approved boolean not null default false,
  rejection_reason text,
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
  room_count integer,
  plan_image_url text
);

alter table listing_units enable row level security;

drop policy if exists "listing_units_public_read" on listing_units;
create policy "listing_units_public_read" on listing_units for select using (true);

-- 이미지와 동일한 기준: 담당자가 배정된 이후엔 등록자가 아니라 현재 담당자만 수정 가능합니다.
drop policy if exists "listing_units_owner_write" on listing_units;
create policy "listing_units_owner_write" on listing_units
  for all using (
    exists (
      select 1 from listings l
      where l.id = listing_units.listing_id
        and (l.agency_id = auth.uid() or (l.agency_id is null and l.registrant_id = auth.uid()))
    )
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
alter table point_transactions enable row level security;

create policy "point_transactions_owner_select" on point_transactions
  for select using (auth.uid() = user_id or is_admin());
-- insert는 add_points() 함수(security definer)를 통해서만 이루어지므로
-- 별도의 insert 정책은 두지 않습니다 (직접 insert는 막혀있는 것이 안전합니다).
alter table listings enable row level security;
alter table builders enable row level security;
alter table regions enable row level security;
alter table listing_images enable row level security;
alter table inquiries enable row level security;
alter table favorites enable row level security;
alter table reviews enable row level security;

-- 누구나 승인된 매물 조회 가능
create policy "listings_public_read" on listings
  for select using (is_approved = true or agency_id = auth.uid() or registrant_id = auth.uid());

-- 분양관계자 본인 매물만 등록 가능 (관리자 승인이 완료된 담당자만 등록 가능). 등록 시점엔
-- 담당자(agency_id)가 아직 배정되지 않으므로 registrant_id 기준으로 확인합니다.
create policy "listings_agency_insert" on listings
  for insert with check (
    auth.uid() = registrant_id
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_approved = true)
  );

create policy "listings_agency_update" on listings
  for update using (auth.uid() = agency_id or (agency_id is null and auth.uid() = registrant_id));

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
    exists (
      select 1 from listings l
      where l.id = listing_images.listing_id
        and (l.agency_id = auth.uid() or (l.agency_id is null and l.registrant_id = auth.uid()))
    )
  );

-- 본인 프로필 생성(회원가입 시 1회) / 조회 / 수정
create policy "profiles_self_insert" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_self_select" on profiles
  for select using (auth.uid() = id);

-- 승인된 분양담당자 계정은 매물 상세페이지에서 담당자 연락처로 공개 노출되어야 하므로,
-- 누구나(비회원 포함) 조회할 수 있게 합니다. 일반회원/미승인 계정은 여전히 본인만 조회 가능합니다.
create policy "profiles_agency_public_read" on profiles
  for select using (role = 'agency' and is_approved = true);

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
-- 담당자 활성화 / 1인 1현장 / 대기열 / 매일 포인트 차감
-- ============================================================
-- listings.agency_id는 "현재 담당자"를 의미하며 대기열 인계에 따라 바뀔 수 있습니다.
-- registrant_id는 "최초 등록자"로 한 번 정해지면 바뀌지 않습니다(등록/승인 이력 확인용).
alter table listings add column if not exists registrant_id uuid references profiles(id);
alter table listings add column if not exists tenure_start timestamptz;
alter table listings add column if not exists last_deduction_date date;
update listings set registrant_id = agency_id where registrant_id is null;

create table if not exists listing_waitlist (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  unique (listing_id, user_id)
);
create index if not exists idx_waitlist_listing on listing_waitlist (listing_id, requested_at);

alter table listing_waitlist enable row level security;
create policy "waitlist_select" on listing_waitlist
  for select using (
    auth.uid() = user_id
    or exists (select 1 from listings l where l.id = listing_id and l.agency_id = auth.uid())
    or is_admin()
  );

-- 대기자 → 현재 담당자로 인계(또는 대기자가 없으면 담당자 미배정 처리)하는 내부 함수입니다.
-- authenticated/anon에는 실행 권한을 주지 않아 클라이언트에서 직접 호출할 수 없고,
-- 아래 stop_managing()/process_daily_deductions() 안에서만 호출됩니다.
-- 담당자가 이탈(그만두기/포인트소진/활동정지)했을 때 호출됩니다.
-- 예전에는 대기열(listing_waitlist)에서 검증 없이 자동으로 다음 사람에게 넘겼지만,
-- 이제는 무조건 미배정 상태로 전환만 하고, 그 다음은 이 현장을 즐겨찾기한 분양담당자들이
-- (알림을 받고) 서류를 제출해 관리자 승인을 거쳐야 새 담당자가 됩니다(선착순 신청, activation_requests).
-- TODO: 알림 발송 연동 예정 — 이 함수가 호출되는 시점에 이 listing_id를 즐겨찾기한
-- 분양담당자 전원에게 카카오 알림톡을 보내는 로직을 추가해야 합니다.
create or replace function handoff_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update listings set agency_id = null, tenure_start = null, last_deduction_date = null
    where id = p_listing_id;
end;
$$;

create or replace function activate_manager(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_approved boolean;
  v_current_manager uuid;
  v_points integer;
  v_title text;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;

  select is_approved, agency_id, title into v_approved, v_current_manager, v_title
    from listings where id = p_listing_id;
  if v_approved is not true then raise exception '승인되지 않은 현장입니다.'; end if;
  if v_current_manager is not null and v_current_manager != auth.uid() then
    raise exception '이미 다른 담당자가 활동중인 현장입니다.';
  end if;

  if exists (select 1 from listings where agency_id = auth.uid() and id != p_listing_id) then
    raise exception '이미 다른 현장을 담당중입니다. 한 분당 하나의 현장만 담당할 수 있습니다.';
  end if;

  select points into v_points from profiles where id = auth.uid();
  if coalesce(v_points, 0) < 15000 then
    raise exception '담당자로 활성화하려면 최소 15,000P가 필요합니다.';
  end if;

  perform add_points(-15000, '사용', format('"%s" 노출 (1일차)', v_title));

  update listings set agency_id = auth.uid(), tenure_start = now(), last_deduction_date = current_date
    where id = p_listing_id;
end;
$$;

create or replace function join_waitlist(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;

  if exists (select 1 from listings where agency_id = auth.uid()) then
    raise exception '이미 다른 현장을 담당중입니다. 한 분당 하나의 현장만 담당할 수 있습니다.';
  end if;

  select points into v_points from profiles where id = auth.uid();
  if coalesce(v_points, 0) < 15000 then
    raise exception '대기자로 등록하려면 최소 15,000P가 필요합니다.';
  end if;

  if exists (select 1 from listing_waitlist where listing_id = p_listing_id and user_id = auth.uid()) then
    raise exception '이미 이 현장의 대기자로 등록되어 있습니다.';
  end if;

  insert into listing_waitlist (listing_id, user_id) values (p_listing_id, auth.uid());
end;
$$;

create or replace function stop_managing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if not exists (select 1 from listings where id = p_listing_id and agency_id = auth.uid()) then
    raise exception '이 현장의 담당자가 아닙니다.';
  end if;
  perform handoff_listing(p_listing_id);
end;
$$;

-- 담당자별로 하루 15,000P씩 차감합니다(마지막 차감일 다음날부터 오늘까지 순차 적용).
-- 포인트가 부족해지면 그 시점에 handoff_listing()으로 자동 인계합니다.
create or replace function process_daily_deductions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
  v_points integer;
  v_new_balance integer;
  guard int;
begin
  for l in
    select id, agency_id, last_deduction_date, title
    from listings
    where agency_id is not null and is_approved = true and last_deduction_date is not null
  loop
    guard := 0;
    while l.last_deduction_date < current_date and guard < 60 loop
      guard := guard + 1;
      select points into v_points from profiles where id = l.agency_id;

      if coalesce(v_points, 0) >= 15000 then
        perform set_config('app.trusted_profile_update', 'true', true);
        update profiles set points = points - 15000 where id = l.agency_id returning points into v_new_balance;
        l.last_deduction_date := l.last_deduction_date + 1;
        insert into point_transactions (user_id, type, amount, note, balance_after)
          values (l.agency_id, '사용', -15000, format('"%s" 노출 (%s)', l.title, l.last_deduction_date), v_new_balance);
        update listings set last_deduction_date = l.last_deduction_date where id = l.id;
      else
        perform handoff_listing(l.id);
        exit;
      end if;
    end loop;
  end loop;
end;
$$;

grant execute on function activate_manager(uuid) to authenticated;
grant execute on function join_waitlist(uuid) to authenticated;
grant execute on function stop_managing(uuid) to authenticated;
-- 검색/상세페이지는 비회원도 보는 페이지라, 여기서 트리거되는 매일 포인트 차감 함수는
-- anon에게도 실행 권한이 있어야 합니다. 없으면 비회원이 볼 때 조용히 실패해서
-- 매일 차감이 사실상 거의 안 일어나는 상태가 됩니다.
grant execute on function process_daily_deductions() to authenticated, anon;
-- handoff_listing()은 authenticated에 권한을 주지 않아 클라이언트에서 직접 호출할 수 없습니다
-- (다른 담당자를 강제로 쫓아내는 데 악용될 수 있어, 위 함수들 내부에서만 쓰이도록 제한합니다).

-- ============================================================
-- 커뮤니티 게시판
-- ============================================================
create table community_posts (
  id uuid primary key default uuid_generate_v4(),
  category text not null check (category in ('free','review','qna','notice')),
  title text not null,
  content text not null,
  author text not null,
  password text not null, -- 데모 수준 평문 저장입니다. 실서비스 전환 시 해시 처리가 필요합니다.
  image_url text,
  views int not null default 0,
  created_at timestamptz not null default now()
);

create table community_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references community_posts(id) on delete cascade,
  author text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table community_reports (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references community_posts(id) on delete cascade,
  post_title text not null,
  post_author text not null,
  reason text not null,
  detail text,
  evidence_url text,
  status text not null default '대기' check (status in ('대기','처리완료','반려')),
  created_at timestamptz not null default now()
);

create table banned_keywords (
  id uuid primary key default uuid_generate_v4(),
  keyword text not null unique,
  created_at timestamptz not null default now()
);

create table blocked_authors (
  id uuid primary key default uuid_generate_v4(),
  author_name text not null unique,
  blocked_at timestamptz not null default now()
);

create index idx_community_comments_post on community_comments (post_id, created_at);

alter table community_posts enable row level security;
alter table community_comments enable row level security;
alter table community_reports enable row level security;
alter table banned_keywords enable row level security;
alter table blocked_authors enable row level security;

-- 게시글/댓글/차단목록/금지어 목록은 누구나 볼 수 있고, 쓰기는 아래 함수를 통해서만 합니다.
create policy "community_posts_public_read" on community_posts for select using (true);
create policy "community_comments_public_read" on community_comments for select using (true);
create policy "banned_keywords_public_read" on banned_keywords for select using (true);
create policy "blocked_authors_public_read" on blocked_authors for select using (true);
create policy "community_reports_admin_select" on community_reports for select using (is_admin());
create policy "community_reports_public_insert" on community_reports for insert with check (true);

create policy "banned_keywords_admin_write" on banned_keywords for all using (is_admin());
create policy "blocked_authors_admin_write" on blocked_authors for all using (is_admin());
create policy "community_reports_admin_update" on community_reports for update using (is_admin());

-- 게시글 작성: 비회원 포함 누구나 가능하지만, 금지 키워드/차단된 작성자는 걸러내고
-- 공지사항(notice)은 관리자만 쓸 수 있게 합니다.
create or replace function create_post(
  p_category text, p_title text, p_content text, p_author text, p_password text, p_image_url text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  hit text;
begin
  if exists (select 1 from blocked_authors where author_name = p_author) then
    raise exception '이용이 제한된 사용자입니다.';
  end if;
  if p_category = 'notice' and not is_admin() then
    raise exception '공지사항은 관리자만 작성할 수 있습니다.';
  end if;

  select keyword into hit from banned_keywords
    where position(lower(keyword) in lower(p_title || ' ' || p_content)) > 0
    limit 1;
  if hit is not null then
    raise exception '게시할 수 없는 단어("%")가 포함되어 있습니다.', hit;
  end if;

  insert into community_posts (category, title, content, author, password, image_url)
    values (p_category, p_title, p_content, p_author, p_password, p_image_url)
    returning id into new_id;

  return new_id;
end;
$$;

create or replace function update_post(
  p_post_id uuid, p_password text, p_category text, p_title text, p_content text, p_image_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() and not exists (
    select 1 from community_posts where id = p_post_id and password = p_password
  ) then
    raise exception '비밀번호가 일치하지 않습니다.';
  end if;

  update community_posts
    set category = p_category, title = p_title, content = p_content, image_url = p_image_url
    where id = p_post_id;
end;
$$;

create or replace function delete_post(p_post_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() and not exists (
    select 1 from community_posts where id = p_post_id and password = p_password
  ) then
    raise exception '비밀번호가 일치하지 않습니다.';
  end if;
  delete from community_posts where id = p_post_id;
end;
$$;

create or replace function admin_delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception '관리자 권한이 필요합니다.'; end if;
  delete from community_posts where id = p_post_id;
end;
$$;

create or replace function create_comment(p_post_id uuid, p_author text, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  hit text;
begin
  if exists (select 1 from blocked_authors where author_name = p_author) then
    raise exception '이용이 제한된 사용자입니다.';
  end if;

  select keyword into hit from banned_keywords
    where position(lower(keyword) in lower(p_content)) > 0
    limit 1;
  if hit is not null then
    raise exception '게시할 수 없는 단어("%")가 포함되어 있습니다.', hit;
  end if;

  insert into community_comments (post_id, author, content) values (p_post_id, p_author, p_content)
    returning id into new_id;
  return new_id;
end;
$$;

create or replace function increment_post_views(p_post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update community_posts set views = views + 1 where id = p_post_id;
$$;

-- 신고를 검토해 처리(글 삭제 + 작성자 차단)하거나 반려합니다. 관리자만 호출 가능합니다.
create or replace function resolve_report(p_report_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if not is_admin() then raise exception '관리자 권한이 필요합니다.'; end if;

  select * into r from community_reports where id = p_report_id;
  if r is null then raise exception '신고 내역을 찾을 수 없습니다.'; end if;

  if p_action = 'delete_post' then
    delete from community_posts where id = r.post_id;
  elsif p_action = 'block_author' then
    insert into blocked_authors (author_name) values (r.post_author) on conflict do nothing;
    delete from community_posts where id = r.post_id;
    -- 이름이 일치하는 분양담당자 계정이 정확히 1명이면 함께 활동금지 처리하고,
    -- 담당중인 현장이 있으면 대기자에게 인계(또는 미배정 전환)합니다.
    if (select count(*) from profiles where role = 'agency' and name = r.post_author) = 1 then
      declare
        v_banned_id uuid;
        v_listing_id uuid;
      begin
        select id into v_banned_id from profiles where role = 'agency' and name = r.post_author;
        update profiles set banned = true where id = v_banned_id;
        for v_listing_id in select id from listings where agency_id = v_banned_id loop
          perform handoff_listing(v_listing_id);
        end loop;
      end;
    end if;
  elsif p_action = 'dismiss' then
    null;
  else
    raise exception '알 수 없는 처리 유형입니다.';
  end if;

  update community_reports
    set status = case when p_action = 'dismiss' then '반려' else '처리완료' end
    where id = p_report_id;
end;
$$;

grant execute on function create_post(text,text,text,text,text,text) to anon, authenticated;
grant execute on function update_post(uuid,text,text,text,text,text) to anon, authenticated;
grant execute on function delete_post(uuid,text) to anon, authenticated;
grant execute on function create_comment(uuid,text,text) to anon, authenticated;
grant execute on function increment_post_views(uuid) to anon, authenticated;
grant execute on function admin_delete_post(uuid) to authenticated;
grant execute on function resolve_report(uuid,text) to authenticated;

-- ============================================================
-- 아이디(이메일) 찾기 — 비회원도 호출해야 하므로 RLS를 우회하는 함수로 제공합니다.
-- ============================================================
create or replace function find_email_by_name_phone(p_name text, p_phone text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email from profiles where name = p_name and phone = p_phone limit 1;
$$;

grant execute on function find_email_by_name_phone(text, text) to anon, authenticated;

-- ============================================================
-- 검색어 통계
-- ============================================================
create table search_log (
  id uuid primary key default uuid_generate_v4(),
  term text not null,
  created_at timestamptz not null default now()
);
create index idx_search_log_created on search_log (created_at desc);

alter table search_log enable row level security;
create policy "search_log_admin_select" on search_log for select using (is_admin());
create policy "search_log_public_insert" on search_log for insert with check (true);

grant insert on search_log to anon;

-- ============================================================
-- Storage (분양 이미지 업로드)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('banner-images', 'banner-images', true)
on conflict (id) do nothing;

drop policy if exists "banner_images_public_read" on storage.objects;
create policy "banner_images_public_read" on storage.objects
  for select using (bucket_id = 'banner-images');

drop policy if exists "banner_images_admin_upload" on storage.objects;
create policy "banner_images_admin_upload" on storage.objects
  for insert with check (bucket_id = 'banner-images' and is_admin());

drop policy if exists "banner_images_admin_delete" on storage.objects;
create policy "banner_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'banner-images' and is_admin());

create policy "community_images_public_read" on storage.objects
  for select using (bucket_id = 'community-images');

create policy "community_images_public_upload" on storage.objects
  for insert with check (bucket_id = 'community-images');

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
-- 일별 방문자수
-- ============================================================
create table if not exists daily_visit_counts (
  visit_date date primary key,
  count int not null default 0
);

alter table daily_visit_counts enable row level security;
drop policy if exists "daily_visits_admin_select" on daily_visit_counts;
create policy "daily_visits_admin_select" on daily_visit_counts for select using (is_admin());

-- 미들웨어에서 방문 1회당 호출합니다(하루 1인 1회로 쿠키로 중복 방지).
create or replace function increment_daily_visit()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into daily_visit_counts (visit_date, count) values (current_date, 1)
    on conflict (visit_date) do update set count = daily_visit_counts.count + 1;
end;
$$;

grant execute on function increment_daily_visit() to anon, authenticated;

-- ============================================================
-- 포팅 과정에서 추가된 신규 테이블들에 대한 기본 접근 권한(GRANT) 재부여
-- (grant ... on all tables in schema는 실행 시점에 "이미 있던" 테이블에만 적용되므로,
--  그 이후 새로 만든 listing_waitlist/community_*/search_log/daily_visit_counts 등은
--  RLS 정책은 있어도 이 기본 권한이 없어서 매번 "permission denied"가 났습니다.)
-- 실제로 어떤 행을 볼 수 있는지는 각 테이블의 RLS 정책이 여전히 그대로 통제합니다.
-- ============================================================
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant insert on inquiries to anon;
grant insert on search_log to anon;

-- ============================================================
-- 회원 스스로 role/points/is_approved/banned를 직접 수정하지 못하게 막는 안전장치
-- (profiles_self_update 정책이 "본인 행"이라는 것만 확인하고 "어떤 칼럼"인지는
--  안 가려서, 이론상 클라이언트가 직접 API를 조작하면 이 값들도 바뀔 수 있었습니다.)
-- ============================================================
create or replace function protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 관리자가 수정하는 경우는 그대로 허용합니다(회원관리 화면 등).
  if is_admin() then
    return new;
  end if;

  -- add_points(), process_daily_deductions()처럼 정당한 시스템 로직이
  -- 이 값들을 바꿀 때는 함수 안에서 먼저 이 트랜잭션 한정 플래그를 켜둡니다.
  if current_setting('app.trusted_profile_update', true) = 'true' then
    return new;
  end if;

  -- 그 외(본인이 직접 자기 프로필을 수정하는 경우)는 민감한 값들을 원래 값으로 되돌립니다.
  new.role := old.role;
  new.points := old.points;
  new.is_approved := old.is_approved;
  new.banned := old.banned;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileged_fields on profiles;
create trigger profiles_protect_privileged_fields
before update on profiles
for each row
execute function protect_profile_privileged_fields();

-- ============================================================
-- 담당자 신청(활성화 요청) — 등록자 본인이 아닌 사람이 미배정 현장의
-- 담당자가 되려는 경우, 서류 제출 후 관리자 승인을 거쳐야만 실제로
-- 활성화(포인트 차감 + 노출)되도록 하는 검증 절차입니다.
-- ============================================================
create table if not exists manager_activation_requests (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  requester_id uuid references profiles(id),
  work_agreement_path text not null,
  business_card_path text not null,
  status text not null default '대기' check (status in ('대기','승인','반려')),
  rejection_reason text,
  created_at timestamptz not null default now()
);

alter table manager_activation_requests enable row level security;

drop policy if exists "activation_requests_own_select" on manager_activation_requests;
create policy "activation_requests_own_select" on manager_activation_requests
  for select using (requester_id = auth.uid() or is_admin());

drop policy if exists "activation_requests_insert" on manager_activation_requests;
create policy "activation_requests_insert" on manager_activation_requests
  for insert with check (
    requester_id = auth.uid()
    -- 이미 다른 현장을 담당중이면 신청 자체가 막힙니다 (1인 1현장 원칙).
    and not exists (select 1 from listings where agency_id = auth.uid())
  );

-- 신청 승인/반려 처리 (관리자 전용). 승인 시 실제 activate_manager와 동일한 검증을
-- 승인 시점에 한 번 더 거친 뒤 담당자로 배정하고 포인트를 차감합니다.
create or replace function resolve_activation_request(p_request_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_points integer;
  v_title text;
begin
  if not is_admin() then
    raise exception '관리자만 처리할 수 있습니다.';
  end if;
  if p_action not in ('승인','반려') then
    raise exception '알 수 없는 처리입니다.';
  end if;

  select * into r from manager_activation_requests where id = p_request_id;
  if r is null then
    raise exception '신청 내역을 찾을 수 없습니다.';
  end if;
  if r.status != '대기' then
    raise exception '이미 처리된 신청입니다.';
  end if;

  if p_action = '반려' then
    update manager_activation_requests set status = '반려' where id = p_request_id;
    return;
  end if;

  -- 승인 처리: 그 사이 상황이 바뀌었을 수 있으니 다시 한 번 확인합니다.
  if exists (select 1 from listings where id = r.listing_id and agency_id is not null) then
    update manager_activation_requests set status = '반려', rejection_reason = '이미 다른 담당자가 배정되었습니다.'
      where id = p_request_id;
    raise exception '이미 다른 담당자가 배정된 현장이라 반려 처리했습니다.';
  end if;
  if exists (select 1 from listings where agency_id = r.requester_id) then
    update manager_activation_requests set status = '반려', rejection_reason = '신청자가 이미 다른 현장을 담당중입니다.'
      where id = p_request_id;
    raise exception '신청자가 이미 다른 현장을 담당중이라 반려 처리했습니다.';
  end if;

  select points into v_points from profiles where id = r.requester_id;
  if coalesce(v_points, 0) < 15000 then
    update manager_activation_requests set status = '반려', rejection_reason = '신청자의 포인트가 부족합니다.'
      where id = p_request_id;
    raise exception '신청자의 포인트가 부족해 반려 처리했습니다.';
  end if;

  select title into v_title from listings where id = r.listing_id;

  update profiles set points = points - 15000 where id = r.requester_id
    returning points into v_points;
  insert into point_transactions (user_id, type, amount, note, balance_after)
    values (r.requester_id, '사용', -15000, format('"%s" 노출 (1일차)', v_title), v_points);

  update listings set agency_id = r.requester_id, tenure_start = now(), last_deduction_date = current_date
    where id = r.listing_id;

  update manager_activation_requests set status = '승인' where id = p_request_id;

  -- 선착순 안전장치: 같은 현장에 걸려있던 다른 대기중 신청들은 자동으로 반려 처리합니다.
  update manager_activation_requests
    set status = '반려', rejection_reason = '다른 신청자가 먼저 승인되었습니다.'
    where listing_id = r.listing_id and status = '대기' and id != p_request_id;
end;
$$;

grant execute on function resolve_activation_request(uuid, text) to authenticated;

-- 검증서류 전용 비공개 Storage 버킷 (업로더 본인 + 관리자만 조회 가능)
insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

drop policy if exists "verification_docs_write" on storage.objects;
create policy "verification_docs_write" on storage.objects
  for insert with check (
    bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verification_docs_read" on storage.objects;
create policy "verification_docs_read" on storage.objects
  for select using (
    bucket_id = 'verification-docs' and (is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

-- ============================================================
-- 대기자 본인의 순번만 계산해서 알려주는 함수. listing_waitlist 조회 정책상
-- 본인이 아니면 다른 대기자 행을 볼 수 없어서, 순번 계산은 이 함수로 우회합니다.
-- (다른 대기자의 신원이나 신청시각은 노출하지 않고 "몇 번째인지" 숫자만 반환합니다.)
-- ============================================================
create or replace function get_my_waitlist_rank(p_listing_id uuid)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*) + 1 from listing_waitlist
  where listing_id = p_listing_id
    and requested_at < (
      select requested_at from listing_waitlist
      where listing_id = p_listing_id and user_id = auth.uid()
    );
$$;

grant execute on function get_my_waitlist_rank(uuid) to authenticated;

-- ============================================================
-- 담당자 신청(activation_requests)의 내 순번만 안전하게 계산해서 알려주는 함수.
-- get_my_waitlist_rank와 같은 이유로, 본인 신청이 아니면 다른 신청자 정보를
-- 볼 수 없어서 순번 계산은 이 함수로 우회합니다.
-- ============================================================
create or replace function get_my_activation_rank(p_request_id uuid)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*) + 1 from manager_activation_requests
  where listing_id = (select listing_id from manager_activation_requests where id = p_request_id)
    and status = '대기'
    and created_at < (select created_at from manager_activation_requests where id = p_request_id);
$$;

grant execute on function get_my_activation_rank(uuid) to authenticated;

-- ============================================================
-- 최초 관리자 계정 안내
-- ============================================================
-- 신규 가입자는 기본적으로 is_approved = false 상태입니다.
-- 최초 관리자 계정은 가입 후 아래처럼 직접 승인/역할 지정이 필요합니다:
--   update profiles set role = 'admin', is_approved = true where email = '<admin-email>';

-- ============================================================
-- 크롤링 수집 매물 구분 (/api/crawler/listings)
-- ============================================================
-- 사람이 등록(work_agreement_path 등 서류 제출)한 매물과, 외부 크롤러가 수집해
-- 넣은 매물을 구분하기 위한 컬럼입니다. 크롤링 매물은 agency_id/registrant_id가
-- 비어있는 상태로 들어오며, is_approved=false로 생성되어 기존과 동일하게
-- 관리자 승인을 거쳐야 노출됩니다. RLS/GRANT는 테이블 단위라 listings에 이미
-- 적용된 정책이 그대로 적용되고(이 컬럼 추가로 별도 변경 불필요), insert 자체는
-- service_role 키를 쓰는 /api/crawler/listings 라우트에서만 이루어집니다
-- (listings_agency_insert 정책상 일반 로그인 계정으로는 불가능합니다).
alter table listings add column if not exists source text not null default 'manual' check (source in ('manual','crawled'));
create index if not exists idx_listings_source on listings (source);


-- ============================================================
-- 기간제 결제 전환: 포인트 충전/일별 차감 → 노출 기간(1·3·7·10일) 선택 후 결제
-- ============================================================
-- 규칙 요약
--  * 요금: 하루 20,000원 (1일/3일/7일/10일 중 선택, 장기 할인은 추후)
--  * 한 현장에는 한 명만. 선점(신청) → 24시간 안에 결제해야 노출. 미결제 시 다음 순번으로 넘어감
--  * 노출 시간 기준은 매일 오전 6시(KST). 6시 전에 결제하면 그날 6시부터, 6시 이후에 결제하면
--    다음날 6시부터 노출되고, 만료도 6시에 됩니다.
--  * 중도 환불: 요청 시각 이후 처음 오는 오전 6시까지는 노출하고, 그 이후 남은 일수만큼 환불
--  * 연장: 노출 종료 전에 추가 결제하면 종료 시각 뒤로 이어 붙음. 연장하지 않으면 다음 순번으로 넘어감
--  * 결제 연동(토스)은 추후. 그 전까지는 관리자 화면에서 "결제 확인"으로 처리합니다.
--
-- ⚠️ 이 파일은 Supabase SQL Editor에서 한 번만 실행하면 됩니다. (schema.sql 맨 아래에도 같은 내용이 들어 있습니다)

-- ---------- 1) 컬럼 / 제약 ----------
alter table listings add column if not exists exposure_ends_at timestamptz;

alter table manager_activation_requests add column if not exists days int not null default 1;
alter table manager_activation_requests drop constraint if exists manager_activation_requests_days_check;
alter table manager_activation_requests add constraint manager_activation_requests_days_check check (days in (1,3,7,10));
alter table manager_activation_requests drop constraint if exists manager_activation_requests_status_check;
alter table manager_activation_requests add constraint manager_activation_requests_status_check
  check (status in ('대기','승인','반려','결제만료'));

-- 같은 현장에 같은 사람이 진행중인 신청을 중복으로 넣지 못하게 합니다.
create unique index if not exists uniq_open_activation_request
  on manager_activation_requests (listing_id, requester_id) where status in ('대기','승인');

-- 신청 시 status를 임의로 '승인'으로 넣는 것을 막습니다.
drop policy if exists "activation_requests_insert" on manager_activation_requests;
create policy "activation_requests_insert" on manager_activation_requests
  for insert with check (
    requester_id = auth.uid()
    and status = '대기'
    and not exists (select 1 from listings where agency_id = auth.uid())
  );

-- 등록 시점에 담당자를 스스로 지정하는 것을 막습니다(노출은 결제 후에만 배정됩니다).
drop policy if exists "listings_agency_insert" on listings;
create policy "listings_agency_insert" on listings
  for insert with check (
    auth.uid() = registrant_id
    and agency_id is null
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_approved = true)
  );

-- ---------- 2) 주문(결제) 테이블 ----------
create table if not exists exposure_orders (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  user_id uuid references profiles(id),
  request_id uuid references manager_activation_requests(id) on delete set null,
  kind text not null default 'new' check (kind in ('new','extend')),
  days int not null check (days in (1,3,7,10)),
  amount integer not null,                         -- 결제 금액(원)
  status text not null default '결제대기'
    check (status in ('결제대기','결제완료','결제만료','종료','환불')),
  pay_deadline timestamptz,                        -- 이 시각까지 결제해야 함
  paid_at timestamptz,
  starts_at timestamptz,                           -- 노출 시작(오전 6시)
  ends_at timestamptz,                             -- 노출 종료(오전 6시)
  payment_key text,                                -- 토스 결제 연동 시 사용
  refunded_days int not null default 0,
  refund_amount integer not null default 0,
  refund_status text check (refund_status in ('환불대기','환불완료')),
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_exposure_orders_listing on exposure_orders (listing_id, status);
create index if not exists idx_exposure_orders_user on exposure_orders (user_id, created_at desc);

alter table exposure_orders enable row level security;
drop policy if exists "exposure_orders_select" on exposure_orders;
create policy "exposure_orders_select" on exposure_orders
  for select using (user_id = auth.uid() or is_admin());
-- insert/update는 아래 함수(security definer)를 통해서만 이루어지므로 정책을 만들지 않습니다.
grant select on exposure_orders to authenticated;
revoke insert, update, delete on exposure_orders from authenticated, anon;

create table if not exists system_state (
  key text primary key,
  ts timestamptz not null
);
alter table system_state enable row level security;

-- ---------- 3) 직접 수정으로 노출을 조작하지 못하게 막는 안전장치 ----------
-- 담당자는 자기 현장 정보를 수정할 수 있는 정책이 있는데, 그 정책이 "어떤 칼럼"인지는 가리지 않아서
-- 담당자 지정/노출 만료일을 직접 바꿀 수 있었습니다. 아래 트리거가 해당 칼럼만 원래 값으로 되돌립니다.
create or replace function protect_listing_exposure_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then return new; end if;
  if current_setting('app.trusted_listing_update', true) = 'true' then return new; end if;
  -- service_role(서버 코드)이나 DB 직접 접속은 허용합니다.
  if auth.uid() is null then return new; end if;

  new.agency_id := old.agency_id;
  new.tenure_start := old.tenure_start;
  new.exposure_ends_at := old.exposure_ends_at;
  new.last_deduction_date := old.last_deduction_date;
  return new;
end;
$$;

drop trigger if exists listings_protect_exposure_fields on listings;
create trigger listings_protect_exposure_fields
before update on listings
for each row
execute function protect_listing_exposure_fields();

-- ---------- 4) 공용 함수 ----------
create or replace function exposure_daily_price()
returns integer language sql immutable as $$ select 20000 $$;

-- p_ts 이후 처음 오는 KST 오전 6시를 돌려줍니다 (정확히 6시 정각이면 다음날 6시).
create or replace function next_exposure_boundary(p_ts timestamptz)
returns timestamptz
language sql
stable
as $$
  select case
    when (p_ts at time zone 'Asia/Seoul')::time < time '06:00'
      then (((p_ts at time zone 'Asia/Seoul')::date + time '06:00') at time zone 'Asia/Seoul')
    else ((((p_ts at time zone 'Asia/Seoul')::date + 1) + time '06:00') at time zone 'Asia/Seoul')
  end
$$;

-- 한 분당 하나의 현장 원칙: 이미 담당중이거나, 다른 현장을 선점(결제대기/노출예정)한 상태인지
create or replace function user_holds_other_listing(p_user uuid, p_listing uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from listings where agency_id = p_user and id <> p_listing)
      or exists (
        select 1 from exposure_orders
        where user_id = p_user and listing_id <> p_listing
          and (status = '결제대기' or (status = '결제완료' and ends_at > now()))
      );
$$;

-- ---------- 5) 선점 / 연장 / 결제 확인 / 환불 ----------
-- 직접 등록한 현장을 곧바로 선점(결제 대기 24시간 시작)합니다. 서류 제출 대상이 아닌 본인 등록 현장용입니다.
create or replace function claim_listing(p_listing_id uuid, p_days int)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_approved boolean;
  v_registrant uuid;
  v_agency uuid;
  v_order uuid;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if p_days not in (1,3,7,10) then raise exception '노출 기간은 1·3·7·10일 중에서 선택해주세요.'; end if;

  select is_approved, registrant_id, agency_id into v_approved, v_registrant, v_agency
    from listings where id = p_listing_id for update;
  if not found then raise exception '현장을 찾을 수 없습니다.'; end if;
  if v_approved is not true then raise exception '승인되지 않은 현장입니다.'; end if;
  if v_registrant is distinct from auth.uid() then
    raise exception '직접 등록한 현장만 바로 선점할 수 있습니다. 다른 현장은 담당자 신청(서류 제출)을 이용해주세요.';
  end if;
  if v_agency is not null then raise exception '이미 담당자가 노출중인 현장입니다.'; end if;
  if exists (
    select 1 from exposure_orders
    where listing_id = p_listing_id and (status = '결제대기' or (status = '결제완료' and ends_at > now()))
  ) then
    raise exception '이미 선점되어 결제 대기 또는 노출 예정인 현장입니다. 결제내역을 확인해주세요.';
  end if;
  if exists (select 1 from manager_activation_requests where listing_id = p_listing_id and status = '승인') then
    raise exception '먼저 신청한 담당자가 순서를 기다리고 있는 현장입니다.';
  end if;
  if user_holds_other_listing(auth.uid(), p_listing_id) then
    raise exception '이미 다른 현장을 담당중이거나 선점중입니다. 한 분당 하나의 현장만 담당할 수 있습니다.';
  end if;

  insert into exposure_orders (listing_id, user_id, kind, days, amount, status, pay_deadline)
    values (p_listing_id, auth.uid(), 'new', p_days, p_days * exposure_daily_price(), '결제대기', now() + interval '24 hours')
    returning id into v_order;
  return v_order;
end;
$$;

-- 현재 담당자가 노출 종료 전에 기간을 연장합니다(종료 시각 뒤로 이어 붙음).
create or replace function request_extension(p_listing_id uuid, p_days int)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency uuid;
  v_end timestamptz;
  v_order uuid;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if p_days not in (1,3,7,10) then raise exception '노출 기간은 1·3·7·10일 중에서 선택해주세요.'; end if;

  select agency_id, exposure_ends_at into v_agency, v_end from listings where id = p_listing_id for update;
  if v_agency is distinct from auth.uid() then raise exception '이 현장의 담당자가 아닙니다.'; end if;
  if v_end is null or v_end <= now() then raise exception '노출이 이미 종료된 현장입니다.'; end if;
  if exists (
    select 1 from exposure_orders
    where listing_id = p_listing_id and user_id = auth.uid() and status = '결제대기'
  ) then
    raise exception '이미 결제 대기중인 건이 있습니다. 결제내역을 확인해주세요.';
  end if;

  insert into exposure_orders (listing_id, user_id, kind, days, amount, status, pay_deadline)
    values (p_listing_id, auth.uid(), 'extend', p_days, p_days * exposure_daily_price(), '결제대기',
            least(now() + interval '24 hours', v_end))
    returning id into v_order;
  return v_order;
end;
$$;

-- 결제 완료 처리. 지금은 관리자가 입금/결제를 확인한 뒤 누르고,
-- 토스 연동 후에는 결제 승인 응답을 받은 서버 코드(service_role)가 호출합니다.
create or replace function confirm_exposure_payment(p_order_id uuid, p_payment_key text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
  v_agency uuid;
  v_cur_end timestamptz;
  v_start timestamptz;
  v_end timestamptz;
begin
  if not (is_admin() or auth.role() = 'service_role') then
    raise exception '결제 확인은 관리자만 처리할 수 있습니다.';
  end if;
  perform set_config('app.trusted_listing_update', 'true', true);

  select * into o from exposure_orders where id = p_order_id for update;
  if not found then raise exception '주문을 찾을 수 없습니다.'; end if;
  if o.status <> '결제대기' then raise exception '결제 대기 상태의 주문이 아닙니다. (현재: %)', o.status; end if;
  if o.pay_deadline < now() then
    raise exception '결제 기한(24시간)이 지난 주문입니다. 처리할 수 없습니다.';
  end if;

  select agency_id, exposure_ends_at into v_agency, v_cur_end from listings where id = o.listing_id for update;

  if o.kind = 'extend' then
    if v_agency is distinct from o.user_id or v_cur_end is null or v_cur_end <= now() then
      raise exception '노출이 이미 종료되어 연장할 수 없는 주문입니다.';
    end if;
    v_start := v_cur_end;
  else
    if v_agency is not null then
      raise exception '이미 다른 담당자가 노출중인 현장입니다.';
    end if;
    v_start := next_exposure_boundary(now());
  end if;
  v_end := v_start + make_interval(days => o.days);

  update exposure_orders
    set status = '결제완료', paid_at = now(), starts_at = v_start, ends_at = v_end,
        payment_key = coalesce(p_payment_key, payment_key)
    where id = o.id;

  if o.kind = 'extend' then
    update listings set exposure_ends_at = v_end where id = o.listing_id;
  end if;
end;
$$;

create or replace function mark_refund_done(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (is_admin() or auth.role() = 'service_role') then
    raise exception '관리자만 처리할 수 있습니다.';
  end if;
  update exposure_orders set refund_status = '환불완료', refunded_at = now()
    where id = p_order_id and refund_status = '환불대기';
  if not found then raise exception '환불 대기 상태의 주문이 아닙니다.'; end if;
end;
$$;

-- 담당자가 광고를 중단하고 남은 기간을 환불 요청합니다.
-- 요청 시각 이후 처음 오는 오전 6시까지는 계속 노출되고, 그 이후 남은 일수만큼 환불 대기로 기록됩니다.
-- 실제 입금 환불은 관리자가 처리한 뒤 "환불 완료"를 누릅니다. 반환값은 환불 예정 금액(원)입니다.
create or replace function stop_managing(p_listing_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
  v_stop timestamptz;
  v_days int;
  v_amount int;
  v_total int := 0;
  v_agency uuid;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  perform set_config('app.trusted_listing_update', 'true', true);

  select agency_id into v_agency from listings where id = p_listing_id for update;
  if not found then raise exception '현장을 찾을 수 없습니다.'; end if;
  if v_agency is distinct from auth.uid()
     and not exists (
       select 1 from exposure_orders
       where listing_id = p_listing_id and user_id = auth.uid() and status = '결제완료' and ends_at > now()
     ) then
    raise exception '이 현장의 담당자가 아닙니다.';
  end if;

  v_stop := next_exposure_boundary(now());

  -- 결제 대기중이던 건은 취소합니다.
  update manager_activation_requests set status = '결제만료'
    where id in (select request_id from exposure_orders
                 where listing_id = p_listing_id and user_id = auth.uid() and status = '결제대기' and request_id is not null);
  update exposure_orders set status = '결제만료'
    where listing_id = p_listing_id and user_id = auth.uid() and status = '결제대기';

  -- 결제 완료된 건 중 중단 시각 이후에 남은 기간을 환불 대기로 돌립니다(뒤에 있는 주문부터).
  for o in
    select * from exposure_orders
    where listing_id = p_listing_id and user_id = auth.uid() and status = '결제완료' and ends_at > v_stop
    order by ends_at desc
    for update
  loop
    if o.starts_at >= v_stop then
      v_days := o.days;
      v_amount := o.amount;
      update exposure_orders
        set status = '환불', refunded_days = v_days, refund_amount = v_amount, refund_status = '환불대기'
        where id = o.id;
    else
      v_days := round(extract(epoch from (o.ends_at - v_stop)) / 86400)::int;
      v_amount := (o.amount / o.days) * v_days;
      update exposure_orders
        set ends_at = v_stop, refunded_days = refunded_days + v_days,
            refund_amount = refund_amount + v_amount, refund_status = '환불대기'
        where id = o.id;
    end if;
    v_total := v_total + v_amount;
  end loop;

  if v_agency = auth.uid() then
    update listings set exposure_ends_at = least(coalesce(exposure_ends_at, v_stop), v_stop) where id = p_listing_id;
  end if;

  return v_total;
end;
$$;

-- ---------- 6) 주기 처리: 결제기한 만료 / 노출 시작 / 노출 종료 / 다음 순번 안내 ----------
-- 여러 번 실행해도 안전합니다(이미 처리된 것은 건드리지 않음).
create or replace function process_exposure_lifecycle()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
  l record;
  r record;
begin
  if not pg_try_advisory_xact_lock(7270001) then return; end if;
  perform set_config('app.trusted_listing_update', 'true', true);

  -- a) 24시간 안에 결제하지 않은 건은 만료 → 아래 d)에서 다음 순번으로 넘어갑니다.
  update manager_activation_requests set status = '결제만료'
    where id in (select request_id from exposure_orders
                 where status = '결제대기' and pay_deadline < now() and request_id is not null);
  update exposure_orders set status = '결제만료' where status = '결제대기' and pay_deadline < now();

  -- b) 노출 시작 시각(오전 6시)이 된 결제 완료 건은 담당자로 배정합니다.
  for o in
    select * from exposure_orders
    where status = '결제완료' and kind = 'new' and starts_at <= now() and ends_at > now()
  loop
    update listings
      set agency_id = o.user_id, tenure_start = o.starts_at, exposure_ends_at = o.ends_at
      where id = o.listing_id and agency_id is null;
  end loop;

  -- c) 노출 종료 시각(오전 6시)이 지난 현장은 담당자 미배정으로 되돌립니다.
  update listings
    set agency_id = null, tenure_start = null, exposure_ends_at = null, last_deduction_date = null
    where agency_id is not null and exposure_ends_at is not null and exposure_ends_at <= now();
  update exposure_orders set status = '종료' where status = '결제완료' and ends_at <= now();

  -- d) 비어 있는 현장은 신청 순서대로 다음 사람에게 24시간 결제 기회를 줍니다.
  -- TODO: 이 시점에 해당 신청자에게 카카오 알림톡(결제 안내)을 보내는 로직을 추가해야 합니다.
  for l in
    select li.id from listings li
    where li.is_approved = true and li.agency_id is null
      and not exists (
        select 1 from exposure_orders e
        where e.listing_id = li.id and (e.status = '결제대기' or (e.status = '결제완료' and e.ends_at > now()))
      )
  loop
    select q.* into r
      from manager_activation_requests q
      where q.listing_id = l.id and q.status = '승인'
        and not exists (select 1 from exposure_orders e2 where e2.request_id = q.id)
        and not user_holds_other_listing(q.requester_id, l.id)
      order by q.created_at
      limit 1;
    if found then
      insert into exposure_orders (listing_id, user_id, request_id, kind, days, amount, status, pay_deadline)
        values (l.id, r.requester_id, r.id, 'new', r.days, r.days * exposure_daily_price(), '결제대기', now() + interval '24 hours');
    end if;
  end loop;
end;
$$;

-- 방문자가 들어올 때마다 가볍게 호출되는 래퍼입니다(1분에 한 번만 실제로 실행).
-- Vercel 무료 플랜의 크론은 하루 1번이라, 오전 6시 정각 처리가 늦어지지 않도록 보완하는 용도입니다.
create or replace function tick_exposure_lifecycle()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last timestamptz;
begin
  select ts into v_last from system_state where key = 'exposure_lifecycle';
  if v_last is not null and v_last > now() - interval '1 minute' then return; end if;
  insert into system_state (key, ts) values ('exposure_lifecycle', now())
    on conflict (key) do update set ts = excluded.ts;
  perform process_exposure_lifecycle();
end;
$$;

-- ---------- 7) 담당자 신청 승인/반려 (포인트 차감 → 순번 대기 방식으로 변경) ----------
-- 승인 = 서류 확인 완료. 현장이 비어 있으면 바로 24시간 결제 기회가 시작되고,
-- 다른 사람이 선점/노출중이면 순서를 기다립니다.
create or replace function resolve_activation_request(p_request_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if not is_admin() then
    raise exception '관리자만 처리할 수 있습니다.';
  end if;
  if p_action not in ('승인','반려') then
    raise exception '알 수 없는 처리입니다.';
  end if;

  select * into r from manager_activation_requests where id = p_request_id;
  if r is null then
    raise exception '신청 내역을 찾을 수 없습니다.';
  end if;
  if r.status <> '대기' then
    raise exception '이미 처리된 신청입니다.';
  end if;

  if p_action = '반려' then
    update manager_activation_requests set status = '반려' where id = p_request_id;
    return;
  end if;

  if r.listing_id is null then
    update manager_activation_requests set status = '반려', rejection_reason = '현장이 삭제되었습니다.' where id = p_request_id;
    raise exception '삭제된 현장이라 반려 처리했습니다.';
  end if;
  if user_holds_other_listing(r.requester_id, r.listing_id) then
    update manager_activation_requests set status = '반려', rejection_reason = '신청자가 이미 다른 현장을 담당중이거나 선점중입니다.'
      where id = p_request_id;
    raise exception '신청자가 이미 다른 현장을 담당중이라 반려 처리했습니다.';
  end if;

  update manager_activation_requests set status = '승인' where id = p_request_id;
  perform process_exposure_lifecycle();
end;
$$;

-- 내 신청의 순번(앞에 서류심사 또는 결제 순번을 기다리는 사람 수 + 1)
create or replace function get_my_activation_rank(p_request_id uuid)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int + 1 from manager_activation_requests q
  where q.listing_id = (select listing_id from manager_activation_requests where id = p_request_id)
    and q.status in ('대기','승인')
    and not exists (select 1 from exposure_orders e where e.request_id = q.id)
    and q.created_at < (select created_at from manager_activation_requests where id = p_request_id);
$$;

-- ---------- 8) 예전 포인트 방식 제거 ----------
-- (포인트 잔액/내역 테이블은 기록 보존용으로 남겨두고, 더 이상 쓰지 않습니다)
drop function if exists add_points(integer, text, text);
drop function if exists process_daily_deductions();
drop function if exists activate_manager(uuid);
drop function if exists handoff_listing(uuid);

-- 대기자 등록(구 방식)에서 포인트 보유 조건만 제거합니다.
create or replace function join_waitlist(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if exists (select 1 from listings where agency_id = auth.uid()) then
    raise exception '이미 다른 현장을 담당중입니다. 한 분당 하나의 현장만 담당할 수 있습니다.';
  end if;
  if exists (select 1 from listing_waitlist where listing_id = p_listing_id and user_id = auth.uid()) then
    raise exception '이미 이 현장의 대기자로 등록되어 있습니다.';
  end if;
  insert into listing_waitlist (listing_id, user_id) values (p_listing_id, auth.uid());
end;
$$;

-- ---------- 9) 권한 ----------
revoke execute on function process_exposure_lifecycle() from public, anon, authenticated;
grant execute on function process_exposure_lifecycle() to service_role;
revoke execute on function user_holds_other_listing(uuid, uuid) from public, anon;
grant execute on function tick_exposure_lifecycle() to anon, authenticated, service_role;
grant execute on function claim_listing(uuid, int) to authenticated;
grant execute on function request_extension(uuid, int) to authenticated;
grant execute on function stop_managing(uuid) to authenticated;
grant execute on function confirm_exposure_payment(uuid, text) to authenticated, service_role;
grant execute on function mark_refund_done(uuid) to authenticated, service_role;
grant execute on function resolve_activation_request(uuid, text) to authenticated;
grant execute on function get_my_activation_rank(uuid) to authenticated;
grant all on exposure_orders, system_state to service_role;

-- ---------- 10) 기존 데이터 정리 ----------
-- 테스트 기간 동안 쌓인 포인트는 모두 없애고, 포인트로 노출중이던 현장은 다음 오전 6시에 종료되도록 맞춥니다.
-- (만료일이 없는 담당자가 무기한 무료 노출되는 것을 막기 위함. 이어서 노출하려면 연장 결제가 필요합니다.)
update listings set exposure_ends_at = next_exposure_boundary(now())
  where agency_id is not null and exposure_ends_at is null;
update listings set last_deduction_date = null where last_deduction_date is not null;
do $$
begin
  perform set_config('app.trusted_profile_update', 'true', true);
  update profiles set points = 0 where points <> 0;
end $$;
