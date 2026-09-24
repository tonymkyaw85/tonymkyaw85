-- MyWork schema, part 8 of 9. Run the parts in order.
revoke execute on function public.mywork_seed_demo_extras(uuid, uuid) from public, anon, authenticated;

create or replace function public.mywork_seed_demo(employee_email text, manager_email text)
returns text
language plpgsql
as $$
declare
  emp uuid;
  mgr uuid;
  d   date;
  i   int := 0;
begin
  select id into emp from auth.users where lower(email) = lower(employee_email);
  select id into mgr from auth.users where lower(email) = lower(manager_email);
  if emp is null or mgr is null then
    raise exception 'Create both users in Authentication → Users first';
  end if;
  if emp = mgr then
    raise exception 'Use two different users (managers cannot approve their own requests)';
  end if;
  perform public.mywork_add_employee(employee_email, 'EMP00123', 'Ahmad Fauzi', 'IT Support', 'Information Technology', 'employee');
  perform public.mywork_add_employee(manager_email, 'EMP00007', 'Siti Rahma', 'IT Manager', 'Information Technology', 'manager');
  update public.mywork_profiles set phone = '+62 812 3456 7890', address = 'East Jakarta, DKI Jakarta', joined_on = '2020-01-12' where id = emp;
  update public.mywork_profiles set phone = '+62 811 2233 4455', address = 'South Jakarta, DKI Jakarta', joined_on = '2016-03-01' where id = mgr;
  -- Attendance for the last 14 days (weekdays), not today.
  for d in select generate_series(current_date - 14, current_date - 1, interval '1 day')::date loop
    if extract(isodow from d) < 6 then
      i := i + 1;
      insert into public.mywork_attendance (user_id, work_date, check_in, check_out)
      values (emp, d,
              (d + time '07:50' + make_interval(mins => (i * 7) % 20)) at time zone 'Asia/Jakarta',
              (d + time '17:00' + make_interval(mins => (i * 11) % 40)) at time zone 'Asia/Jakarta')
      on conflict (user_id, work_date) do nothing;
    end if;
  end loop;
  insert into public.mywork_requests (user_id, type, title, date_from, date_to, note, amount, category, status, reviewed_by, reviewed_at, created_at)
  values
    (emp, 'cuti', 'Annual Leave', current_date - 3, current_date - 1, 'Family matters.', null, null, 'Approved', mgr, now() - interval '2 hours', now() - interval '3 hours'),
    (emp, 'izin', 'Permission', current_date - 11, current_date - 11, 'Late Arrival: Handling civil registry documents.', null, null, 'Pending', null, null, now() - interval '4 hours'),
    (emp, 'lembur', 'Overtime', current_date - 18, current_date - 18, 'Server maintenance outside working hours (18:00–21:00)', null, null, 'Rejected', mgr, now() - interval '6 days', now() - interval '7 days'),
    (emp, 'reimburse', 'Reimbursement', current_date - 22, current_date - 22, 'Transport for client meeting', 150000, 'Transport', 'Approved', mgr, now() - interval '6 days', now() - interval '7 days');
  insert into public.mywork_notifications (user_id, title, body, icon, color, link, created_at, read)
  values
    (emp, 'Leave approved', 'Your annual leave request was approved.', 'check', 'green', '#/status', now() - interval '2 hours', false),
    (emp, 'Overtime rejected', 'Your overtime request was rejected.', 'x', 'red', '#/status', now() - interval '6 days', true),
    (mgr, 'Request waiting for you', 'Ahmad Fauzi submitted a permission request.', 'clipboard', 'orange', '#/approvals', now() - interval '4 hours', false);
  perform public.mywork_seed_demo_extras(emp, mgr);
  return 'Demo data created for ' || employee_email || ' (employee) and ' || manager_email || ' (manager)';
end;
$$;

