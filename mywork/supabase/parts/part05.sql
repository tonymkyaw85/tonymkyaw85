-- MyWork schema, part 5 of 9. Run the parts in order.
drop policy if exists "requests: submit" on public.mywork_requests;

create policy "requests: submit" on public.mywork_requests
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "requests: cancel pending" on public.mywork_requests;

create policy "requests: cancel pending" on public.mywork_requests
  for delete to authenticated using (user_id = auth.uid() and status = 'Pending');

drop policy if exists "notifications: read own" on public.mywork_notifications;

create policy "notifications: read own" on public.mywork_notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "notifications: mark own read" on public.mywork_notifications;

create policy "notifications: mark own read" on public.mywork_notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "announcements: read" on public.mywork_announcements;

create policy "announcements: read" on public.mywork_announcements
  for select to authenticated using (true);

drop policy if exists "documents: read own" on public.mywork_documents;

create policy "documents: read own" on public.mywork_documents
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "documents: add own" on public.mywork_documents;

create policy "documents: add own" on public.mywork_documents
  for insert to authenticated
  with check (user_id = auth.uid() and storage_path like auth.uid()::text || '/%');

drop policy if exists "documents: delete own" on public.mywork_documents;

create policy "documents: delete own" on public.mywork_documents
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "payslips: read own" on public.mywork_payslips;

create policy "payslips: read own" on public.mywork_payslips
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "schedule: read own and company" on public.mywork_schedule_events;

create policy "schedule: read own and company" on public.mywork_schedule_events
  for select to authenticated using (user_id is null or user_id = auth.uid());

revoke all on public.mywork_profiles, public.mywork_attendance, public.mywork_requests, public.mywork_notifications,
              public.mywork_announcements, public.mywork_documents, public.mywork_payslips, public.mywork_schedule_events from anon;

revoke insert, update, delete on public.mywork_profiles, public.mywork_attendance, public.mywork_requests, public.mywork_notifications,
              public.mywork_announcements, public.mywork_documents, public.mywork_payslips, public.mywork_schedule_events from authenticated;

grant select on public.mywork_profiles, public.mywork_attendance, public.mywork_requests, public.mywork_notifications,
              public.mywork_announcements, public.mywork_documents, public.mywork_payslips, public.mywork_schedule_events to authenticated;

grant update (phone, address) on public.mywork_profiles to authenticated;

grant insert (work_date, location) on public.mywork_attendance to authenticated;

grant update (check_out) on public.mywork_attendance to authenticated;

grant insert (type, title, date_from, date_to, note, amount, category, attachment_path) on public.mywork_requests to authenticated;

grant delete on public.mywork_requests to authenticated;

grant update (read) on public.mywork_notifications to authenticated;

