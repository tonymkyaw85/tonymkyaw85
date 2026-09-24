-- MyWork schema, part 2 of 9. Run the parts in order.
create table if not exists public.mywork_requests (
  id              bigint generated always as identity primary key,
  user_id         uuid not null default auth.uid() references public.mywork_profiles (id) on delete cascade,
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
  reviewed_by     uuid references public.mywork_profiles (id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  check (date_to >= date_from)
);

create index if not exists mywork_requests_user_idx on public.mywork_requests (user_id, created_at desc);

create index if not exists mywork_requests_pending_idx on public.mywork_requests (status) where status = 'Pending';

create or replace function public.mywork_requests_guard()
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
      from public.mywork_requests
     where user_id = new.user_id and type = 'cuti' and title = 'Annual Leave'
       and status <> 'Rejected' and extract(year from date_from) = extract(year from new.date_from);
    select annual_leave_days into allowed from public.mywork_profiles where id = new.user_id;
    if used + (new.date_to - new.date_from + 1) > allowed then
      raise exception 'Not enough leave balance';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists mywork_requests_guard on public.mywork_requests;

create trigger mywork_requests_guard
  before insert on public.mywork_requests
  for each row execute function public.mywork_requests_guard();

create or replace function public.mywork_review_request(p_id bigint, p_status text, p_note text default null)
returns public.mywork_requests
language plpgsql security definer set search_path = public
as $$
declare
  r public.mywork_requests;
begin
  if not public.mywork_is_manager() then
    raise exception 'Only managers can review requests';
  end if;
  if p_status not in ('Approved', 'Rejected') then
    raise exception 'Invalid status';
  end if;
  update public.mywork_requests
     set status = p_status, review_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_id and status = 'Pending' and user_id <> auth.uid()
  returning * into r;
  if r.id is null then
    raise exception 'Request not found, already reviewed, or your own';
  end if;
  return r;
end;
$$;

