-- MyWork schema, part 7 of 9. Run the parts in order.
create or replace function public.mywork_seed_demo_extras(emp uuid, mgr uuid)
returns void
language plpgsql
as $$
declare
  d      date;
  m      int;
  lembur numeric;
  gross  numeric;
begin
  -- Payslips for the last 6 months, for both users.
  for m in 0..5 loop
    lembur := (array[300000, 450000, 250000, 600000, 450000, 350000])[m + 1];
    gross  := 6500000 + 750000 + 900000 + lembur;
    insert into public.mywork_payslips (user_id, period, earnings, deductions)
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
      insert into public.mywork_schedule_events (user_id, event_date, start_time, title, place, color)
      values (emp, d, '09:00', 'IT Team Meeting', 'Meeting Room 1', 'green'),
             (emp, d, case when extract(day from d)::int % 2 = 0 then time '13:00' else time '14:00' end,
                   case when extract(day from d)::int % 2 = 0 then 'Server Maintenance' else 'New Device Installation' end,
                   case when extract(day from d)::int % 2 = 0 then 'Data Center' else '5th Floor' end, 'blue'),
             (emp, d, '15:00', case when extract(isodow from d) = 5 then 'Weekly Report' else 'Database Backup' end,
                   case when extract(isodow from d) = 5 then 'Online Meeting' else 'Data Center' end, 'purple');
    end if;
  end loop;
  insert into public.mywork_schedule_events (user_id, event_date, title, place, color, is_holiday)
  values (null, '2026-09-28', 'National Holiday – Prophet''s Birthday', 'Office closed', 'red', true);
  -- Announcements (the trigger also notifies every active employee).
  insert into public.mywork_announcements (category, icon, color, title, body, published_on) values
    ('Company', 'megaphone', 'red', 'National Holiday', 'In observance of the Prophet''s Birthday, the office will be closed on 28 Sep 2026. Normal operations resume on Tuesday, 29 Sep 2026.', current_date - 12),
    ('HR', 'file', 'blue', 'Work From Office Policy Update', 'Starting October 2026, WFO applies 3 days a week (Monday, Wednesday, Thursday). On other days you may work from home, but still record attendance in the MyWork app.', current_date - 14),
    ('HR', 'heart', 'red', 'Employee Health Program', 'Free health check-ups on the 3rd floor of Head Office, 08:00–15:00. Please fast for 8 hours beforehand for the blood sugar test.', current_date - 16),
    ('IT', 'lock', 'purple', 'Periodic Password Update', 'For security, all employees must update their account password every 90 days. Use at least 12 characters combining letters, numbers and symbols.', current_date - 22);
end;
$$;

