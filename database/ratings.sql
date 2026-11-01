-- Phase 7: ratings after sessions.
-- Run in Supabase > SQL Editor. If the editor says "Only singular query allowed",
-- run each statement below on its own (one at a time, in order).
--
-- Rules enforced inside the database:
--   * Ratings are public to signed-in students (they show on profiles and peer cards).
--   * You can only rate the other student of a confirmed session that has already ended.
--   * You rate as yourself, once per session, from 1 to 5 stars.
--   * Ratings can't be edited or deleted after sending.

create table public.ratings (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id bigint not null references public.sessions (id) on delete cascade,
  rater_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  ratee_id uuid not null references public.profiles (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text check (char_length(comment) <= 300),
  constraint ratings_one_per_session unique (session_id, rater_id),
  constraint ratings_two_people check (rater_id <> ratee_id)
);

create index ratings_ratee_idx on public.ratings (ratee_id);

alter table public.ratings enable row level security;

create policy "Students can read ratings"
on public.ratings for select to authenticated
using (true);

create policy "Participants can rate a finished session"
on public.ratings for insert to authenticated
with check (
  auth.uid() = rater_id
  and exists (
    select 1 from public.sessions s
    where s.id = ratings.session_id
      and s.status = 'accepted'
      and s.ends_at < now()
      and (
        (s.requester_id = auth.uid() and s.partner_id = ratings.ratee_id)
        or (s.partner_id = auth.uid() and s.requester_id = ratings.ratee_id)
      )
  )
);
