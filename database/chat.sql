-- Phase 5: chat with attachments.
-- Run in Supabase > SQL Editor. If the editor complains about more than one
-- statement, run each statement below on its own (one at a time, in order).
--
-- Rules enforced inside the database:
--   * You can only read messages you sent or received.
--   * You can only send as yourself, to someone else.
--   * A message needs text or a file. Text is limited to 2000 characters.
--   * An attached file must live in your own folder of the storage bucket.
--   * Attachments are private: only the two people in the chat can open them.

create table public.messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text check (char_length(body) between 1 and 2000),
  file_path text,
  file_name text,
  file_type text,
  constraint messages_two_people check (sender_id <> recipient_id),
  constraint messages_has_content check (body is not null or file_path is not null),
  constraint messages_own_file check (file_path is null or file_path like sender_id::text || '/%')
);

create index messages_sender_idx on public.messages (sender_id, recipient_id, created_at);
create index messages_recipient_idx on public.messages (recipient_id, sender_id, created_at);

alter table public.messages enable row level security;

create policy "Participants can read their messages"
on public.messages for select to authenticated
using (auth.uid() in (sender_id, recipient_id));

create policy "Users can send messages as themselves"
on public.messages for insert to authenticated
with check (auth.uid() = sender_id);

-- Realtime: lets the app receive new messages without refreshing.
-- (Realtime only delivers rows the signed-in user is allowed to read.)
alter publication supabase_realtime add table public.messages;

-- Private storage bucket for attachments: 5 MB limit, images and documents only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments', 'chat-attachments', false, 5242880,
  array[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
);

-- Upload only into your own folder (the first part of the path is your user id).
create policy "Users upload to their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chat-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Open a file if you uploaded it, or if it is attached to a message you are part of.
create policy "Chat participants can open attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'chat-attachments'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.messages m
      where m.file_path = name and auth.uid() in (m.sender_id, m.recipient_id)
    )
  )
);
