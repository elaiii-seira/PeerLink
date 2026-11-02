-- Safeguard: a student can't tag the same skill twice as teach (or twice as learn).
-- Run once in Supabase > SQL Editor. If it says the constraint already exists, you can ignore it.
-- If it says duplicates exist, delete the extra rows in Table Editor > user_skills first.

alter table public.user_skills
  add constraint user_skills_no_duplicates unique (user_id, skill_id, type);

-- Length limits, so the database enforces what the forms already ask for.
-- "not valid" checks every new or changed row without failing on rows that already exist.

alter table public.profiles
  add constraint profiles_text_limits check (
    char_length(full_name) <= 100 and char_length(course) <= 100
    and char_length(year_level) <= 20 and char_length(bio) <= 300
  ) not valid;

alter table public.sessions
  add constraint sessions_text_limits check (
    char_length(location) <= 120 and char_length(note) <= 300
  ) not valid;
