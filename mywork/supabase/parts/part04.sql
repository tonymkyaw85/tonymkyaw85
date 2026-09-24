-- MyWork schema, part 4 of 9. Run the parts in order.
create table if not exists public.mywork_documents (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references public.mywork_profiles (id) on delete cascade,
  name         text not null,
  file_name    text not null,
  size_bytes   bigint not null default 0,
  kind         text not null default 'blue' check (kind in ('blue', 'red', 'green', 'orange', 'purple')),
  storage_path text not null unique,
  created_at   timestamptz not null default now()
);

create table if not exists public.mywork_payslips (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.mywork_profiles (id) on delete cascade,
  period     text not null check (period ~ '^\d{4}-\d{2}$'),
  earnings   jsonb not null default '[]',    deductions jsonb not null default '[]',    created_at timestamptz not null default now(),
  unique (user_id, period)
);

create table if not exists public.mywork_schedule_events (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.mywork_profiles (id) on delete cascade,    event_date date not null,
  start_time time,
  title      text not null,
  place      text not null default '',
  color      text not null default 'blue' check (color in ('blue', 'red', 'green', 'orange', 'purple')),
  is_holiday boolean not null default false
);

create index if not exists mywork_schedule_events_date_idx on public.mywork_schedule_events (event_date);

alter table public.mywork_profiles        enable row level security;

alter table public.mywork_attendance      enable row level security;

alter table public.mywork_requests        enable row level security;

alter table public.mywork_notifications   enable row level security;

alter table public.mywork_announcements   enable row level security;

alter table public.mywork_documents       enable row level security;

alter table public.mywork_payslips        enable row level security;

alter table public.mywork_schedule_events enable row level security;

drop policy if exists "profiles: read own or as manager" on public.mywork_profiles;

create policy "profiles: read own or as manager" on public.mywork_profiles
  for select to authenticated using (id = auth.uid() or public.mywork_is_manager());

drop policy if exists "profiles: update own" on public.mywork_profiles;

create policy "profiles: update own" on public.mywork_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "attendance: read own or as manager" on public.mywork_attendance;

create policy "attendance: read own or as manager" on public.mywork_attendance
  for select to authenticated using (user_id = auth.uid() or public.mywork_is_manager());

drop policy if exists "attendance: check in" on public.mywork_attendance;

create policy "attendance: check in" on public.mywork_attendance
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "attendance: check out" on public.mywork_attendance;

create policy "attendance: check out" on public.mywork_attendance
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "requests: read own or as manager" on public.mywork_requests;

create policy "requests: read own or as manager" on public.mywork_requests
  for select to authenticated using (user_id = auth.uid() or public.mywork_is_manager());

