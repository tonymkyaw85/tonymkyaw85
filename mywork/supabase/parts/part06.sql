-- MyWork schema, part 6 of 9. Run the parts in order.
grant insert (name, file_name, size_bytes, kind, storage_path) on public.mywork_documents to authenticated;

grant delete on public.mywork_documents to authenticated;

revoke execute on function public.mywork_review_request(bigint, text, text) from public, anon;

grant execute on function public.mywork_review_request(bigint, text, text) to authenticated;

revoke execute on function public.mywork_add_employee(text, text, text, text, text, text) from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('mywork-documents', 'mywork-documents', false, 10485760),
       ('mywork-request-attachments', 'mywork-request-attachments', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "mywork documents: own folder read" on storage.objects;

create policy "mywork documents: own folder read" on storage.objects
  for select to authenticated
  using (bucket_id = 'mywork-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "mywork documents: own folder upload" on storage.objects;

create policy "mywork documents: own folder upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'mywork-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "mywork documents: own folder delete" on storage.objects;

create policy "mywork documents: own folder delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'mywork-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "mywork attachments: read own or as manager" on storage.objects;

create policy "mywork attachments: read own or as manager" on storage.objects
  for select to authenticated
  using (bucket_id = 'mywork-request-attachments'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.mywork_is_manager()));

drop policy if exists "mywork attachments: own folder upload" on storage.objects;

create policy "mywork attachments: own folder upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'mywork-request-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

