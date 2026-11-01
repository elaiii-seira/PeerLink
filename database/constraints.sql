-- Safeguard: a student can't tag the same skill twice as teach (or twice as learn).
-- Run once in Supabase > SQL Editor. If it says the constraint already exists, you can ignore it.
-- If it says duplicates exist, delete the extra rows in Table Editor > user_skills first.

alter table public.user_skills
  add constraint user_skills_no_duplicates unique (user_id, skill_id, type);
