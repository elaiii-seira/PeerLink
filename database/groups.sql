-- Phase 6 + 9: study groups with join approval.
-- Run in Supabase > SQL Editor. If the editor says "Only singular query allowed",
-- run each statement below on its own (one at a time, in order).
-- (Already ran the earlier version of this file? Run database/groups-approval.sql instead.)
--
-- Rules enforced inside the database:
--   * Any signed-in student can browse groups (name, subject, description, size).
--   * You create a group as yourself, and only the owner can edit or delete it.
--   * Nobody can join on their own. A student sends a join request, and only the group's
--     owner can approve it. Approving adds the student; a full group can't take more.
--   * Members can leave. The owner can remove other members but can't leave (delete the group).
--   * Only members can read or post in a group's chat, and only as themselves.

create table public.study_groups (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 3 and 60),
  description text check (char_length(description) <= 500),
  skill_id bigint references public.skills (id) on delete set null,
  max_members int not null default 10 check (max_members between 2 and 50)
);

create table public.group_members (
  group_id bigint not null references public.study_groups (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- A pending request to join. Deleted when the owner approves or declines it.
create table public.group_join_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  group_id bigint not null references public.study_groups (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  constraint group_join_requests_once unique (group_id, user_id)
);

create table public.group_messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  group_id bigint not null references public.study_groups (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000)
);

create index group_members_user_idx on public.group_members (user_id);
create index group_messages_group_idx on public.group_messages (group_id, created_at);

alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_join_requests enable row level security;
alter table public.group_messages enable row level security;

create policy "Students can browse groups"
on public.study_groups for select to authenticated
using (true);

create policy "Students can create groups"
on public.study_groups for insert to authenticated
with check (auth.uid() = owner_id);

create policy "Owners can edit their groups"
on public.study_groups for update to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Owners can delete their groups"
on public.study_groups for delete to authenticated
using (auth.uid() = owner_id);

create policy "Students can see group members"
on public.group_members for select to authenticated
using (true);

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

create policy "Members can leave, except the owner"
on public.group_members for delete to authenticated
using (
  auth.uid() = user_id
  and not exists (
    select 1 from public.study_groups g
    where g.id = group_members.group_id and g.owner_id = auth.uid()
  )
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

create policy "Members can read group messages"
on public.group_messages for select to authenticated
using (
  exists (
    select 1 from public.group_members m
    where m.group_id = group_messages.group_id and m.user_id = auth.uid()
  )
);

create policy "Members can post group messages"
on public.group_messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.group_members m
    where m.group_id = group_messages.group_id and m.user_id = auth.uid()
  )
);

-- Realtime: new group messages reach members without a refresh.
alter publication supabase_realtime add table public.group_messages;
