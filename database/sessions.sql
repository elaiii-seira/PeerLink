-- Phase 4: tutoring sessions.
-- Run once in Supabase > SQL Editor > New query.
--
-- Rules enforced inside the database (not only in the app):
--   * You can only see sessions you are part of.
--   * You can only create a request as yourself, and only for a future time.
--   * Only the invited student can accept or decline; either student can cancel.
--   * Time, people and skill can't be edited after sending (send a new request instead).
--   * Double-booking check: a request or acceptance is blocked if either student
--     already has a confirmed (accepted) session overlapping that time.

create table public.sessions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  requester_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  partner_id uuid not null references public.profiles (id) on delete cascade,
  skill_id bigint references public.skills (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  constraint sessions_two_people check (requester_id <> partner_id),
  constraint sessions_valid_time check (ends_at > starts_at)
);

create index sessions_requester_idx on public.sessions (requester_id);
create index sessions_partner_idx on public.sessions (partner_id);

alter table public.sessions enable row level security;

create policy "Participants can view their sessions"
on public.sessions for select to authenticated
using (auth.uid() in (requester_id, partner_id));

create policy "Users can request sessions"
on public.sessions for insert to authenticated
with check (auth.uid() = requester_id and status = 'pending');

create policy "Participants can update their sessions"
on public.sessions for update to authenticated
using (auth.uid() in (requester_id, partner_id))
with check (auth.uid() in (requester_id, partner_id));

-- Status rules and double-booking check.
-- "security definer" lets the check see the other student's sessions,
-- which normal row level security would hide from you.
create or replace function public.check_session_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.starts_at <= now() then
    raise exception 'Pick a time in the future.';
  end if;

  if tg_op = 'UPDATE' then
    if new.requester_id <> old.requester_id or new.partner_id <> old.partner_id
       or new.starts_at <> old.starts_at or new.ends_at <> old.ends_at
       or new.skill_id is distinct from old.skill_id then
      raise exception 'Only the status of a session can be changed. Send a new request instead.';
    end if;

    if new.status <> old.status then
      if new.status = 'pending' then
        raise exception 'A session cannot go back to pending.';
      elsif new.status in ('accepted', 'declined')
        and (old.status <> 'pending' or auth.uid() is distinct from old.partner_id) then
        raise exception 'Only the invited student can accept or decline a pending request.';
      elsif new.status = 'cancelled' and old.status not in ('pending', 'accepted') then
        raise exception 'This session can no longer be cancelled.';
      end if;
    end if;
  end if;

  if new.status in ('pending', 'accepted')
     and (tg_op = 'INSERT' or new.status <> old.status) then
    if exists (
      select 1 from public.sessions s
      where s.status = 'accepted'
        and s.id <> new.id
        and s.starts_at < new.ends_at
        and new.starts_at < s.ends_at
        and (s.requester_id in (new.requester_id, new.partner_id)
             or s.partner_id in (new.requester_id, new.partner_id))
    ) then
      raise exception 'Double booking: one of you already has a confirmed session at that time.';
    end if;
  end if;

  return new;
end;
$$;

create trigger sessions_rules
before insert or update on public.sessions
for each row execute function public.check_session_rules();
