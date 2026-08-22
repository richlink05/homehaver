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
        and (l.agency_id = auth.uid() or l.registrant_id = auth.uid())
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
create or replace function handoff_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_row record;
begin
  loop
    select * into next_row from listing_waitlist
      where listing_id = p_listing_id
      order by requested_at asc
      limit 1;

    if next_row is null then
      update listings set agency_id = null, tenure_start = null, last_deduction_date = null
        where id = p_listing_id;
      return;
    end if;

    delete from listing_waitlist where id = next_row.id;

    if coalesce((select points from profiles where id = next_row.user_id), 0) >= 15000 then
      update listings set agency_id = next_row.user_id, tenure_start = null, last_deduction_date = null
        where id = p_listing_id;
      return;
    end if;
    -- 포인트 부족한 대기자는 자동으로 건너뛰고 다음 대기자를 확인합니다.
  end loop;
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
-- 최초 관리자 계정 안내
-- ============================================================
-- 신규 가입자는 기본적으로 is_approved = false 상태입니다.
-- 최초 관리자 계정은 가입 후 아래처럼 직접 승인/역할 지정이 필요합니다:
--   update profiles set role = 'admin', is_approved = true where email = '<admin-email>';
