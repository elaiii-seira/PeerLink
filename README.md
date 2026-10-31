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
| Backend and database | Supabase (PostgreSQL, Auth, REST API) | Managed relational database with built-in authentication and an auto-generated API. Row Level Security enforces who can read or change each row inside the database. |
| Hosting | Vercel | Connects to GitHub and redeploys on every push to `main`. |

**Change from the proposal.** The proposal planned Node/Express with MySQL. It was replaced with Supabase because it keeps a relational model (PostgreSQL), provides secure authentication out of the box, and removes the need to host and secure a separate server and database for a solo project. Access rules are written as Row Level Security policies instead of Express middleware.

## Features

| Feature | Status |
|---|---|
| Register, login, logout, protected pages | Done |
| Dashboard | Done |
| Profile editing, teach/learn tags, availability | Done |
| Browse, search and filters, suggested peers | Done |
| Session scheduling and weekly calendar | Planned |
| In-app chat with attachments | Planned |
| Study groups | Planned |
| Ratings and session history | Planned |

## Database

- `profiles`: id (links to auth user), full_name, course, year_level, bio, availability (text array)
- `skills`: id, name, category (`academic` or `practical`). One shared catalog, so subjects and skills use the same tagging system. Seed data is in `database/skills.csv`.
- `user_skills`: id, user_id (links to profiles), skill_id (links to skills), type (`teach` or `learn`)

## Matching

Suggestions compare your tags with every other student's (`src/peers.js`):

- **Can teach you**: they teach a skill you want to learn.
- **Wants to learn from you**: they want to learn a skill you teach.
- **Mutual match**: both are true. Mutual matches always rank first, then students with more overlapping skills, then those with more shared availability slots.

The Browse page filters by search text (name, course, skill), subject or skill, category, availability, course, and year level. Filters are kept in the URL, so a filtered view survives a refresh and can be linked to.

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
  components/   AuthShell, PageHeader, PeerCard, RouteGuards
  pages/        Login, Register, Dashboard, Profile, Browse
  AuthContext.jsx, supabase.js, options.js, peers.js
  App.jsx, main.jsx, index.css
database/       skills seed data, demo classmates script
```
