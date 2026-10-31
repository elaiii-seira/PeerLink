-- Demo classmates for testing Browse and matching.
--
-- 1. In Supabase > Authentication > Users > Add user > Create new user, create these
--    five accounts (any password, tick "Auto Confirm User"):
--      marco@peerlink.test, bea@peerlink.test, josh@peerlink.test,
--      andrea@peerlink.test, carlo@peerlink.test
-- 2. Open SQL Editor > New query, paste this whole file, and click Run.
--
-- Safe to run more than once: profiles are updated, tags are not duplicated.
-- Students are matched to accounts by email and to skills by name, so no ids are hard-coded.

with demo(email, full_name, course, year_level, bio, availability) as (values
  ('marco@peerlink.test',  'Marco Santos',   'BSCpE', '3rd year', 'Python tutor for two semesters. Happy to trade for calculus help.', array['Weekends','Weekday evenings']),
  ('bea@peerlink.test',    'Bea Ramirez',    'BSIT',  '2nd year', 'I edit videos for our org and want to get better at presenting.',   array['Weekday evenings']),
  ('josh@peerlink.test',   'Josh Dela Cruz', 'BSCE',  '1st year', 'Strong in physics, still new to programming.',                       array['Weekday mornings','Weekends']),
  ('andrea@peerlink.test', 'Andrea Lim',     'BSIT',  '4th year', 'I design org pubs and can help with public speaking.',               array['Weekends']),
  ('carlo@peerlink.test',  'Carlo Reyes',    'BSCpE', '2nd year', 'Arduino and circuits. Looking for a study buddy for Calculus.',      array['Weekday afternoons','Weekends'])
)
insert into public.profiles (id, full_name, course, year_level, bio, availability)
select u.id, d.full_name, d.course, d.year_level, d.bio, d.availability
from demo d join auth.users u on u.email = d.email
on conflict (id) do update set
  full_name = excluded.full_name, course = excluded.course, year_level = excluded.year_level,
  bio = excluded.bio, availability = excluded.availability;

with tags(email, skill, type) as (values
  ('marco@peerlink.test',  'Python', 'teach'),
  ('marco@peerlink.test',  'Programming Fundamentals', 'teach'),
  ('marco@peerlink.test',  'Calculus', 'learn'),
  ('bea@peerlink.test',    'Video Editing', 'teach'),
  ('bea@peerlink.test',    'Canva', 'teach'),
  ('bea@peerlink.test',    'Public Speaking', 'learn'),
  ('josh@peerlink.test',   'Physics', 'teach'),
  ('josh@peerlink.test',   'Programming Fundamentals', 'learn'),
  ('josh@peerlink.test',   'Python', 'learn'),
  ('andrea@peerlink.test', 'Public Speaking', 'teach'),
  ('andrea@peerlink.test', 'Graphic Design', 'teach'),
  ('andrea@peerlink.test', 'Canva', 'learn'),
  ('carlo@peerlink.test',  'Arduino', 'teach'),
  ('carlo@peerlink.test',  'Circuit Analysis', 'teach'),
  ('carlo@peerlink.test',  'Calculus', 'learn')
)
insert into public.user_skills (user_id, skill_id, type)
select u.id, s.id, t.type
from tags t
join auth.users u on u.email = t.email
join public.skills s on s.name = t.skill
where not exists (
  select 1 from public.user_skills x
  where x.user_id = u.id and x.skill_id = s.id and x.type = t.type
);
