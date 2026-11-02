-- Phase 9: join approval for study groups.
-- For a database that already ran the earlier database/groups.sql.
-- (A fresh database only needs database/groups.sql, which already includes this.)
-- Run in Supabase > SQL Editor, one statement at a time if the editor complains.
--
-- After this, nobody can join a group on their own: a student sends a join request and
-- only the group's owner can approve it.

create table public.group_join_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  group_id bigint not null references public.study_groups (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  constraint group_join_requests_once unique (group_id, user_id)
);

alter table public.group_join_requests enable row level security;

drop policy "Students can join groups that have room" on public.group_members;

create policy "Owners add students who asked to join"
on public.group_members for insert to authenticated
with check (
  exists (
    select 1 from public.study_groups g
    where g.id = group_members.group_id and g.owner_id = auth.uid()
  )
  and (
    group_members.user_id = auth.uid()
    or exists (
      select 1 from public.group_join_requests r
      where r.group_id = group_members.group_id and r.user_id = group_members.user_id
    )
  )
  and (select count(*) from public.group_members m where m.group_id = group_members.group_id)
      < (select g.max_members from public.study_groups g where g.id = group_members.group_id)
);

create policy "Owners can remove other members"
on public.group_members for delete to authenticated
using (
  group_members.user_id <> auth.uid()
  and exists (
    select 1 from public.study_groups g
    where g.id = group_members.group_id and g.owner_id = auth.uid()
  )
);

create policy "Students and group owners can read requests"
on public.group_join_requests for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.study_groups g
    where g.id = group_join_requests.group_id and g.owner_id = auth.uid()
  )
);

create policy "Students can ask to join groups they are not in"
on public.group_join_requests for insert to authenticated
with check (
  auth.uid() = user_id
  and not exists (
    select 1 from public.group_members m
    where m.group_id = group_join_requests.group_id and m.user_id = auth.uid()
  )
);

create policy "Students can cancel requests, owners can answer them"
on public.group_join_requests for delete to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.study_groups g
    where g.id = group_join_requests.group_id and g.owner_id = auth.uid()
  )
);
