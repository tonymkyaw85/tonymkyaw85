-- MyWork schema, part 1 of 9. Run the parts in order.
create table if not exists public.mywork_profiles (
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

create or replace function public.mywork_is_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.mywork_profiles where id = auth.uid() and app_role = 'manager');
$$;

create or replace function public.mywork_add_employee(
  p_email text, p_employee_id text, p_full_name text,
  p_job_title text default '', p_department text default '', p_app_role text default 'employee')
returns text
language plpgsql
as $$
declare
  u uuid;
begin
  select id into u from auth.users where lower(email) = lower(p_email);
  if u is null then
    raise exception 'No user with email %. Create them in Authentication → Users first.', p_email;
  end if;
  insert into public.mywork_profiles (id, email, employee_id, full_name, job_title, department, app_role)
  values (u, p_email, p_employee_id, p_full_name, p_job_title, p_department, p_app_role)
  on conflict (id) do update
    set email = excluded.email, employee_id = excluded.employee_id, full_name = excluded.full_name,
        job_title = excluded.job_title, department = excluded.department, app_role = excluded.app_role;
  return p_full_name || ' can now sign in to MyWork as ' || p_app_role;
end;
$$;

create table if not exists public.mywork_attendance (
  id        bigint generated always as identity primary key,
  user_id   uuid not null default auth.uid() references public.mywork_profiles (id) on delete cascade,
  work_date date not null,
  check_in  timestamptz not null default now(),
  check_out timestamptz,
  location  text not null default 'Head Office',
  unique (user_id, work_date),
  check (check_out is null or check_out >= check_in)
);

create or replace function public.mywork_attendance_guard()
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

drop trigger if exists mywork_attendance_guard on public.mywork_attendance;

create trigger mywork_attendance_guard
  before insert or update on public.mywork_attendance
  for each row execute function public.mywork_attendance_guard();

