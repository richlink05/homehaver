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
