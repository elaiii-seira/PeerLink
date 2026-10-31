# PeerLink (Phase 1: auth + dashboard)

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase URL and publishable key
3. `npm run dev` (opens at http://localhost:5173)

## Git + deploy
```
git init
git add .
git commit -m "Phase 1: auth and dashboard"
git branch -M main
git remote add origin https://github.com/<you>/peerlink.git
git push -u origin main
```
Then import the repo in Vercel, add the two `VITE_` variables under Environment Variables, and deploy.
After deploying, add your Vercel URL in Supabase: Authentication > URL Configuration.

## Structure
```
src/
  components/   shared UI (AuthShell, RouteGuards)
  pages/        Login, Register, Dashboard
  AuthContext.jsx   session + profile state
  supabase.js       Supabase client
  App.jsx, main.jsx, index.css
```
