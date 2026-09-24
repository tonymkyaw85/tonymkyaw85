-- MyWork schema, part 3 of 9. Run the parts in order.
create table if not exists public.mywork_notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.mywork_profiles (id) on delete cascade,
  title      text not null,
  body       text not null default '',
  icon       text not null default 'bell',
  color      text not null default 'blue' check (color in ('blue', 'red', 'green', 'orange', 'purple')),
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists mywork_notifications_user_idx on public.mywork_notifications (user_id, created_at desc);

create or replace function public.mywork_notify_request_reviewed()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  ok boolean := new.status = 'Approved';
begin
  if new.status is distinct from old.status and new.status in ('Approved', 'Rejected') then
    insert into public.mywork_notifications (user_id, title, body, icon, color, link)
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

drop trigger if exists mywork_notify_request_reviewed on public.mywork_requests;

create trigger mywork_notify_request_reviewed
  after update of status on public.mywork_requests
  for each row execute function public.mywork_notify_request_reviewed();

create table if not exists public.mywork_announcements (
  id           bigint generated always as identity primary key,
  category     text not null check (category in ('Company', 'HR', 'IT')),
  icon         text not null default 'megaphone',
  color        text not null default 'blue' check (color in ('blue', 'red', 'green', 'orange', 'purple')),
  title        text not null,
  body         text not null,
  published_on date not null default current_date,
  created_at   timestamptz not null default now()
);

create or replace function public.mywork_notify_announcement()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.mywork_notifications (user_id, title, body, icon, color, link)
  select p.id, 'New announcement', new.title, 'megaphone', 'blue', '#/pengumuman'
    from public.mywork_profiles p where p.status = 'Active';
  return new;
end;
$$;

drop trigger if exists mywork_notify_announcement on public.mywork_announcements;

create trigger mywork_notify_announcement
  after insert on public.mywork_announcements
  for each row execute function public.mywork_notify_announcement();

