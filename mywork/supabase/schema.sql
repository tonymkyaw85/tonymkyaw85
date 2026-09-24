-- MyWork – Supabase schema
-- Run once in the Supabase dashboard: SQL Editor → New query → paste this file → Run.
-- Safe to re-run: every object is created with IF NOT EXISTS / OR REPLACE.
--
-- Security model
--   * Every table has row level security (RLS). The anon key can read nothing.
--   * Employees see only their own rows. Managers (profiles.app_role = 'manager')
--     can also see everyone's profiles, attendance and requests, and approve requests.
--   * Server-controlled fields (timestamps, request status, owner) are set by triggers,
--     so a user cannot back-date a check-in or approve their own request.
--   * Clients can only write the columns they need (column-level GRANTs).

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  employee_id       text unique,
  full_name         text not null default '',
  email             text,
  job_title         text not null default '',
  department        text not null default '',
  phone             text not null default '',
  address           text not null default '',
  joined_on         date not null default current_date,
  status            text not null default 'Active',
  app_role          text not null default 'employee' check (app_role in ('employee', 'manager')),
  annual_leave_days int  not null default 12 check (annual_leave_days >= 0),
  created_at        timestamptz not null default now()
);

create or replace function public.is_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and app_role = 'manager');
$$;

-- New auth user → profile. Role is never taken from user-supplied metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Attendance
-- ---------------------------------------------------------------------------
create table if not exists public.attendance (
  id        bigint generated always as identity primary key,
  user_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  work_date date not null,
  check_in  timestamptz not null default now(),
  check_out timestamptz,
  location  text not null default 'Head Office',
  unique (user_id, work_date),
  check (check_out is null or check_out >= check_in)
);

-- Check-in/out times always come from the server clock.
-- (auth.uid() is null in the SQL editor, so admins can still import history.)
create or replace function public.attendance_guard()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.user_id   := auth.uid();
    new.check_in  := now();
    new.check_out := null;
    if abs(new.work_date - current_date) > 1 then
      raise exception 'work_date must be today';
    end if;
  else
    if old.check_out is not null then
      raise exception 'Already checked out';
    end if;
    new.user_id   := old.user_id;
    new.work_date := old.work_date;
    new.check_in  := old.check_in;
    new.location  := old.location;
    new.check_out := now();
  end if;
  return new;
end;
$$;

drop trigger if exists attendance_guard on public.attendance;
create trigger attendance_guard
  before insert or update on public.attendance
  for each row execute function public.attendance_guard();

-- ---------------------------------------------------------------------------
-- Requests (leave, permission, overtime, reimbursement)
-- ---------------------------------------------------------------------------
create table if not exists public.requests (
  id              bigint generated always as identity primary key,
  user_id         uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type            text not null check (type in ('cuti', 'izin', 'lembur', 'reimburse')),
  title           text not null,
  date_from       date not null,
  date_to         date not null,
  note            text not null default '',
  amount          numeric(14, 2) check (amount is null or amount > 0),
  category        text,
  attachment_path text,
  status          text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  review_note     text,
  reviewed_by     uuid references public.profiles (id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  check (date_to >= date_from)
);
create index if not exists requests_user_idx on public.requests (user_id, created_at desc);
create index if not exists requests_pending_idx on public.requests (status) where status = 'Pending';

create or replace function public.requests_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  used int;
  allowed int;
begin
  if auth.uid() is null then
    return new;
  end if;
  new.user_id     := auth.uid();
  new.status      := 'Pending';
  new.review_note := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.created_at  := now();
  if new.attachment_path is not null and new.attachment_path not like auth.uid()::text || '/%' then
    raise exception 'Invalid attachment path';
  end if;
  if new.type = 'cuti' and new.title = 'Annual Leave' then
    select coalesce(sum(date_to - date_from + 1), 0) into used
      from public.requests
     where user_id = new.user_id and type = 'cuti' and title = 'Annual Leave'
       and status <> 'Rejected' and extract(year from date_from) = extract(year from new.date_from);
    select annual_leave_days into allowed from public.profiles where id = new.user_id;
    if used + (new.date_to - new.date_from + 1) > allowed then
      raise exception 'Not enough leave balance';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists requests_guard on public.requests;
create trigger requests_guard
  before insert on public.requests
  for each row execute function public.requests_guard();

-- Managers approve/reject through this function (no direct UPDATE grant).
create or replace function public.review_request(p_id bigint, p_status text, p_note text default null)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  r public.requests;
begin
  if not public.is_manager() then
    raise exception 'Only managers can review requests';
  end if;
  if p_status not in ('Approved', 'Rejected') then
    raise exception 'Invalid status';
  end if;
  update public.requests
     set status = p_status, review_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_id and status = 'Pending' and user_id <> auth.uid()
  returning * into r;
  if r.id is null then
    raise exception 'Request not found, already reviewed, or your own';
  end if;
  return r;
end;
$$;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text not null default '',
  icon       text not null default 'bell',
  color      text not null default 'blue' check (color in ('blue', 'red', 'green', 'orange', 'purple')),
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.notify_request_reviewed()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  ok boolean := new.status = 'Approved';
begin
  if new.status is distinct from old.status and new.status in ('Approved', 'Rejected') then
    insert into public.notifications (user_id, title, body, icon, color, link)
    values (
      new.user_id,
      new.title || case when ok then ' approved' else ' rejected' end,
      'Your ' || lower(new.title) || ' request for ' || to_char(new.date_from, 'FMDD Mon YYYY')
        || case when new.date_to <> new.date_from then ' - ' || to_char(new.date_to, 'FMDD Mon YYYY') else '' end
        || ' was ' || lower(new.status)
        || coalesce(': "' || new.review_note || '"', '.'),
      case when ok then 'check' else 'x' end,
      case when ok then 'green' else 'red' end,
      '#/status'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_request_reviewed on public.requests;
create trigger notify_request_reviewed
  after update of status on public.requests
  for each row execute function public.notify_request_reviewed();

-- ---------------------------------------------------------------------------
-- Announcements (published by HR from the dashboard)
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id           bigint generated always as identity primary key,
  category     text not null check (category in ('Company', 'HR', 'IT')),
  icon         text not null default 'megaphone',
  color        text not null default 'blue' check (color in ('blue', 'red', 'green', 'orange', 'purple')),
  title        text not null,
  body         text not null,
  published_on date not null default current_date,
  created_at   timestamptz not null default now()
);

create or replace function public.notify_announcement()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, body, icon, color, link)
  select p.id, 'New announcement', new.title, 'megaphone', 'blue', '#/pengumuman'
    from public.profiles p where p.status = 'Active';
  return new;
end;
$$;

drop trigger if exists notify_announcement on public.announcements;
create trigger notify_announcement
  after insert on public.announcements
  for each row execute function public.notify_announcement();

-- ---------------------------------------------------------------------------
-- Documents, payslips, schedule
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name         text not null,
  file_name    text not null,
  size_bytes   bigint not null default 0,
  kind         text not null default 'blue' check (kind in ('blue', 'red', 'green', 'orange', 'purple')),
  storage_path text not null unique,
  created_at   timestamptz not null default now()
);

create table if not exists public.payslips (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  period     text not null check (period ~ '^\d{4}-\d{2}$'),
  earnings   jsonb not null default '[]',  -- [["Basic Salary", 6500000], ...]
  deductions jsonb not null default '[]',  -- [["BPJS Health", 130000], ...]
  created_at timestamptz not null default now(),
  unique (user_id, period)
);

create table if not exists public.schedule_events (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles (id) on delete cascade,  -- null = everyone
  event_date date not null,
  start_time time,
  title      text not null,
  place      text not null default '',
  color      text not null default 'blue' check (color in ('blue', 'red', 'green', 'orange', 'purple')),
  is_holiday boolean not null default false
);
create index if not exists schedule_events_date_idx on public.schedule_events (event_date);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.attendance      enable row level security;
alter table public.requests        enable row level security;
alter table public.notifications   enable row level security;
alter table public.announcements   enable row level security;
alter table public.documents       enable row level security;
alter table public.payslips        enable row level security;
alter table public.schedule_events enable row level security;

drop policy if exists "profiles: read own or as manager" on public.profiles;
create policy "profiles: read own or as manager" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_manager());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "attendance: read own or as manager" on public.attendance;
create policy "attendance: read own or as manager" on public.attendance
  for select to authenticated using (user_id = auth.uid() or public.is_manager());
drop policy if exists "attendance: check in" on public.attendance;
create policy "attendance: check in" on public.attendance
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "attendance: check out" on public.attendance;
create policy "attendance: check out" on public.attendance
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "requests: read own or as manager" on public.requests;
create policy "requests: read own or as manager" on public.requests
  for select to authenticated using (user_id = auth.uid() or public.is_manager());
drop policy if exists "requests: submit" on public.requests;
create policy "requests: submit" on public.requests
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "requests: cancel pending" on public.requests;
create policy "requests: cancel pending" on public.requests
  for delete to authenticated using (user_id = auth.uid() and status = 'Pending');

drop policy if exists "notifications: read own" on public.notifications;
create policy "notifications: read own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications: mark own read" on public.notifications;
create policy "notifications: mark own read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "announcements: read" on public.announcements;
create policy "announcements: read" on public.announcements
  for select to authenticated using (true);

drop policy if exists "documents: read own" on public.documents;
create policy "documents: read own" on public.documents
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "documents: add own" on public.documents;
create policy "documents: add own" on public.documents
  for insert to authenticated
  with check (user_id = auth.uid() and storage_path like auth.uid()::text || '/%');
drop policy if exists "documents: delete own" on public.documents;
create policy "documents: delete own" on public.documents
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "payslips: read own" on public.payslips;
create policy "payslips: read own" on public.payslips
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "schedule: read own and company" on public.schedule_events;
create policy "schedule: read own and company" on public.schedule_events
  for select to authenticated using (user_id is null or user_id = auth.uid());

-- Column-level privileges: clients may only write these columns.
revoke all on public.profiles, public.attendance, public.requests, public.notifications,
              public.announcements, public.documents, public.payslips, public.schedule_events from anon;
revoke insert, update, delete on public.profiles, public.attendance, public.requests, public.notifications,
              public.announcements, public.documents, public.payslips, public.schedule_events from authenticated;
grant select on public.profiles, public.attendance, public.requests, public.notifications,
              public.announcements, public.documents, public.payslips, public.schedule_events to authenticated;
grant update (phone, address) on public.profiles to authenticated;
grant insert (work_date, location) on public.attendance to authenticated;
grant update (check_out) on public.attendance to authenticated;
grant insert (type, title, date_from, date_to, note, amount, category, attachment_path) on public.requests to authenticated;
grant delete on public.requests to authenticated;
grant update (read) on public.notifications to authenticated;
grant insert (name, file_name, size_bytes, kind, storage_path) on public.documents to authenticated;
grant delete on public.documents to authenticated;

revoke execute on function public.review_request(bigint, text, text) from public, anon;
grant execute on function public.review_request(bigint, text, text) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private buckets, one folder per user (<user id>/<file>)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 10485760),
       ('request-attachments', 'request-attachments', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "mywork documents: own folder read" on storage.objects;
create policy "mywork documents: own folder read" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "mywork documents: own folder upload" on storage.objects;
create policy "mywork documents: own folder upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "mywork documents: own folder delete" on storage.objects;
create policy "mywork documents: own folder delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Request attachments: the employee and managers can read them.
drop policy if exists "mywork attachments: read own or as manager" on storage.objects;
create policy "mywork attachments: read own or as manager" on storage.objects
  for select to authenticated
  using (bucket_id = 'request-attachments'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_manager()));
drop policy if exists "mywork attachments: own folder upload" on storage.objects;
create policy "mywork attachments: own folder upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'request-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Demo data (optional)
-- 1. Authentication → Users → Add user: create an employee and a manager.
-- 2. Run:  select public.mywork_seed_demo('employee@example.com', 'manager@example.com');
-- Only callable from the SQL editor, not from the app.
-- ---------------------------------------------------------------------------
create or replace function public.mywork_seed_demo(employee_email text, manager_email text)
returns text
language plpgsql
as $$
declare
  emp uuid;
  mgr uuid;
  d   date;
  i   int := 0;
  m   int;
  lembur numeric;
  gross numeric;
begin
  select id into emp from auth.users where lower(email) = lower(employee_email);
  select id into mgr from auth.users where lower(email) = lower(manager_email);
  if emp is null or mgr is null then
    raise exception 'Create both users in Authentication → Users first';
  end if;
  if emp = mgr then
    raise exception 'Use two different users (managers cannot approve their own requests)';
  end if;

  insert into public.profiles (id, email) values (emp, employee_email), (mgr, manager_email)
  on conflict (id) do nothing;

  update public.profiles set employee_id = 'EMP00123', full_name = 'Ahmad Fauzi', job_title = 'IT Support',
         department = 'Information Technology', phone = '+62 812 3456 7890', address = 'East Jakarta, DKI Jakarta',
         joined_on = '2020-01-12', app_role = 'employee'
   where id = emp;
  update public.profiles set employee_id = 'EMP00007', full_name = 'Siti Rahma', job_title = 'IT Manager',
         department = 'Information Technology', phone = '+62 811 2233 4455', address = 'South Jakarta, DKI Jakarta',
         joined_on = '2016-03-01', app_role = 'manager'
   where id = mgr;

  -- Attendance for the last 14 days (weekdays), not today.
  for d in select generate_series(current_date - 14, current_date - 1, interval '1 day')::date loop
    if extract(isodow from d) < 6 then
      i := i + 1;
      insert into public.attendance (user_id, work_date, check_in, check_out)
      values (emp, d,
              (d + time '07:50' + make_interval(mins => (i * 7) % 20)) at time zone 'Asia/Jakarta',
              (d + time '17:00' + make_interval(mins => (i * 11) % 40)) at time zone 'Asia/Jakarta')
      on conflict (user_id, work_date) do nothing;
    end if;
  end loop;

  insert into public.requests (user_id, type, title, date_from, date_to, note, amount, category, status, reviewed_by, reviewed_at, created_at)
  values
    (emp, 'cuti', 'Annual Leave', current_date - 3, current_date - 1, 'Family matters.', null, null, 'Approved', mgr, now() - interval '2 hours', now() - interval '3 hours'),
    (emp, 'izin', 'Permission', current_date - 11, current_date - 11, 'Late Arrival: Handling civil registry documents.', null, null, 'Pending', null, null, now() - interval '4 hours'),
    (emp, 'lembur', 'Overtime', current_date - 18, current_date - 18, 'Server maintenance outside working hours (18:00–21:00)', null, null, 'Rejected', mgr, now() - interval '6 days', now() - interval '7 days'),
    (emp, 'reimburse', 'Reimbursement', current_date - 22, current_date - 22, 'Transport for client meeting', 150000, 'Transport', 'Approved', mgr, now() - interval '6 days', now() - interval '7 days');

  insert into public.notifications (user_id, title, body, icon, color, link, created_at, read)
  values
    (emp, 'Leave approved', 'Your annual leave request was approved.', 'check', 'green', '#/status', now() - interval '2 hours', false),
    (emp, 'Overtime rejected', 'Your overtime request was rejected.', 'x', 'red', '#/status', now() - interval '6 days', true),
    (mgr, 'Request waiting for you', 'Ahmad Fauzi submitted a permission request.', 'clipboard', 'orange', '#/approvals', now() - interval '4 hours', false);

  -- Payslips for the last 6 months, for both users.
  for m in 0..5 loop
    lembur := (array[300000, 450000, 250000, 600000, 450000, 350000])[m + 1];
    gross  := 6500000 + 750000 + 900000 + lembur;
    insert into public.payslips (user_id, period, earnings, deductions)
    select u, to_char(date_trunc('month', current_date) - make_interval(months => m), 'YYYY-MM'),
           jsonb_build_array(jsonb_build_array('Basic Salary', 6500000), jsonb_build_array('Transport Allowance', 750000),
                             jsonb_build_array('Meal Allowance', 900000), jsonb_build_array('Overtime', lembur)),
           jsonb_build_array(jsonb_build_array('BPJS Health', 130000), jsonb_build_array('BPJS Employment', 260000),
                             jsonb_build_array('Income Tax (PPh 21)', round((gross - 390000) * 0.043)))
      from unnest(array[emp, mgr]) as u
    on conflict (user_id, period) do nothing;
  end loop;

  -- Schedule: team agenda on weekdays for ±30 days, plus a company holiday.
  for d in select generate_series(current_date - 30, current_date + 30, interval '1 day')::date loop
    if extract(isodow from d) < 6 then
      insert into public.schedule_events (user_id, event_date, start_time, title, place, color)
      values (emp, d, '09:00', 'IT Team Meeting', 'Meeting Room 1', 'green'),
             (emp, d, case when extract(day from d)::int % 2 = 0 then time '13:00' else time '14:00' end,
                   case when extract(day from d)::int % 2 = 0 then 'Server Maintenance' else 'New Device Installation' end,
                   case when extract(day from d)::int % 2 = 0 then 'Data Center' else '5th Floor' end, 'blue'),
             (emp, d, '15:00', case when extract(isodow from d) = 5 then 'Weekly Report' else 'Database Backup' end,
                   case when extract(isodow from d) = 5 then 'Online Meeting' else 'Data Center' end, 'purple');
    end if;
  end loop;
  insert into public.schedule_events (user_id, event_date, title, place, color, is_holiday)
  values (null, '2026-09-28', 'National Holiday – Prophet''s Birthday', 'Office closed', 'red', true);

  -- Announcements (the trigger also notifies every active employee).
  insert into public.announcements (category, icon, color, title, body, published_on) values
    ('Company', 'megaphone', 'red', 'National Holiday', 'In observance of the Prophet''s Birthday, the office will be closed on 28 Sep 2026. Normal operations resume on Tuesday, 29 Sep 2026.', current_date - 12),
    ('HR', 'file', 'blue', 'Work From Office Policy Update', 'Starting October 2026, WFO applies 3 days a week (Monday, Wednesday, Thursday). On other days you may work from home, but still record attendance in the MyWork app.', current_date - 14),
    ('HR', 'heart', 'red', 'Employee Health Program', 'Free health check-ups on the 3rd floor of Head Office, 08:00–15:00. Please fast for 8 hours beforehand for the blood sugar test.', current_date - 16),
    ('IT', 'lock', 'purple', 'Periodic Password Update', 'For security, all employees must update their account password every 90 days. Use at least 12 characters combining letters, numbers and symbols.', current_date - 22);

  return 'Demo data created for ' || employee_email || ' (employee) and ' || manager_email || ' (manager)';
end;
$$;

revoke execute on function public.mywork_seed_demo(text, text) from public, anon, authenticated;
