# PeerLink-Skill Up

A peer tutoring and skill-swap matching platform for students. Students list what they can teach and what they want to learn, covering academic subjects and practical skills, and are matched with classmates who have complementary needs.

- Live site: https://peer-link-nine.vercel.app
- Repository: https://github.com/elaiii-seira/PeerLink
- Course: Elec 3 (Technical Elective III), PRMSU College of Engineering

## Tech stack and why

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Component model suits profile, search, and scheduling views; Vite gives fast builds. |
| Styling | Tailwind CSS with design tokens | Responsive layout and one themed palette defined in `src/index.css`. |
| Backend and database | Supabase (PostgreSQL, Auth, REST API, Realtime, Storage) | Managed relational database with built-in authentication and an auto-generated API. Row Level Security enforces who can read or change each row inside the database. |
| Hosting | Vercel | Connects to GitHub and redeploys on every push to `main`. |

**Change from the proposal.** The proposal planned Node/Express with MySQL. It was replaced with Supabase because it keeps a relational model (PostgreSQL), provides secure authentication out of the box, and removes the need to host and secure a separate server and database for a solo project. Access rules are written as Row Level Security policies instead of Express middleware.

## Features

| Feature | Status |
|---|---|
| Register, login, logout, protected pages | Done |
| Dashboard | Done |
| Profile editing, teach/learn tags, availability | Done |
| Browse, search and filters, suggested peers | Done |
| Session scheduling and weekly calendar | Done |
| In-app chat with attachments | Done |
| Study groups with group chat | Done |
| Ratings and session history | Done |

## Database

- `profiles`: id (links to auth user), full_name, course, year_level, bio, availability (text array)
- `skills`: id, name, category (`academic` or `practical`). One shared catalog, so subjects and skills use the same tagging system. Seed data is in `database/skills.csv`.
- `user_skills`: id, user_id (links to profiles), skill_id (links to skills), type (`teach` or `learn`)
- `sessions`: id, requester_id and partner_id (both link to profiles), skill_id, starts_at, ends_at, location, note, status (`pending`, `accepted`, `declined`, `cancelled`). Created by `database/sessions.sql`.
- `messages`: id, sender_id and recipient_id (both link to profiles), body, file_path, file_name, file_type. Created by `database/chat.sql`, which also sets up the private `chat-attachments` storage bucket.
- `study_groups`: id, owner_id (links to profiles), name, description, skill_id, max_members. `group_members`: group_id, user_id (one row per member). `group_messages`: id, group_id, sender_id, body. Created by `database/groups.sql`.
- `ratings`: id, session_id (links to sessions), rater_id and ratee_id (both link to profiles), stars (1 to 5), comment. Created by `database/ratings.sql`.

## Matching

Suggestions compare your tags with every other student's (`src/peers.js`):

- **Can teach you**: they teach a skill you want to learn.
- **Wants to learn from you**: they want to learn a skill you teach.
- **Mutual match**: both are true. Mutual matches always rank first, then students with more overlapping skills, then those with more shared availability slots.

The Browse page filters by search text (name, course, skill), subject or skill, category, availability, course, and year level. Filters are kept in the URL, so a filtered view survives a refresh and can be linked to.

## Session scheduling

A student requests a session from a classmate's card (topic, date, time, length, place, note). The other student accepts or declines it on the Sessions page, and either one can cancel. The Sessions page shows pending requests, a weekly calendar (a day list on phones), and upcoming confirmed sessions. The dashboard shows upcoming sessions, highlights any within 24 hours as a reminder, and counts requests waiting for an answer.

These rules are enforced in the database by row level security and a trigger (`database/sessions.sql`), so they hold even if someone calls the API directly:

- Students only see sessions they are part of.
- Requests must be for a future time and can only be sent as yourself.
- Only the invited student can accept or decline. Time, people, and topic can't be edited after sending.
- **Double-booking check:** a request or acceptance is rejected if either student already has a confirmed session that overlaps it.

## Chat

Any two students can message each other: press Message on a classmate's card in Browse, or on a confirmed session. The Chat page lists your conversations and shows the thread. New messages appear instantly through Supabase Realtime, so no refresh is needed. A message can include one attachment (image, PDF, Word, PowerPoint or text file, up to 5 MB).

These rules are enforced in the database (`database/chat.sql`):

- Students only read messages they sent or received, and can only send as themselves.
- A message needs text (up to 2000 characters) or a file.
- Attachments are stored in a private bucket, in a folder named after the sender. Only the two people in the chat can open a file, through a temporary signed link.

## Study groups

Any student can create a group (name, subject, description, size limit), browse and search groups, and join or leave them. A group page shows its members and a group chat that updates live through Supabase Realtime. The creator leads the group and can delete it.

These rules are enforced in the database (`database/groups.sql`):

- Students create groups as themselves, and only the owner can edit or delete a group.
- Students join and leave as themselves. A full group can't be joined, and the owner can't leave without deleting the group.
- Only members can read or post in a group's chat, and only as themselves.

## Ratings and session history

After a confirmed session ends, either student can rate the other from 1 to 5 stars with an optional comment (Sessions page, Past sessions). A student's average rating shows on their card in Browse and Dashboard, and your own Profile page lists the ratings you received and your completed sessions.

These rules are enforced in the database (`database/ratings.sql`):

- Only the two students of a confirmed session can rate each other, and only after it has ended.
- You rate as yourself, once per session, from 1 to 5 stars.
- Ratings are visible to signed-in students and can't be edited or deleted after sending.

CRUD in the app: create and delete skill tags, read the catalog and tags, update profile details.

## Run locally

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the Supabase URL and publishable key
3. `npm run dev` and open http://localhost:5173

## Deployment

1. Push the repository to GitHub.
2. Import it in Vercel (Vite preset is detected).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as environment variables.
4. Deploy. Every push to `main` redeploys automatically.
5. In Supabase, set the Site URL and Redirect URLs to the Vercel address.

## Git workflow

Work is done on feature branches (`feature/...`, `fix/...`), opened as pull requests, and merged into `main`.

## Structure

```
src/
  components/   AuthShell, CreateGroup, PageHeader, PeerCard, ProfileActivity, RateSession, RequestSession, RouteGuards, Stars
  pages/        Login, Register, Dashboard, Profile, Browse, Sessions, Chat, Groups, GroupDetail
  AuthContext.jsx, supabase.js, options.js, peers.js, sessions.js, chat.js, groups.js, ratings.js
  App.jsx, main.jsx, index.css
database/       skills seed data, demo classmates script, sessions table, chat table and storage, study groups tables, ratings table
```
