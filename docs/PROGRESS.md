# Job tracker: progress

Status legend: ⬜ todo · 🟡 in progress · ✅ done · ⛔ blocked

## Phase 0: Setup (11–14 Nov)
- ✅ `CLAUDE.md`, README, docs written by Claude (2026-11-11)
- ✅ `git init` (me), `.gitignore` + first commit (Claude, 2026-11-12)
- ⬜ Push to `ghifarij/job-tracker` (me)

## Phase 1: Build (15–16 Nov)
- ✅ Decide the repo layout and how Express runs on Vercel (J8, J9; 2026-11-12)
- ✅ Scaffold `frontend/` (Next.js) and `backend/` (Express + `/health` + test) (Claude, 2026-11-12)
- ✅ Decide how login works across the two domains, the database access and validation (J10–J12; 2026-11-12). Reviewed RekJobs' backend first: its Google login trusted `googleId`/`email` from the request body without verifying the token. Don't repeat that.
- ✅ Decide the application fields and status values (J13, J14; 2026-11-12)
- ⬜ Google OAuth client created in Google Cloud Console (me)
- ⬜ Neon database created (me)
- ⬜ Google login + per-user data scoping
- ⬜ Applications: add, edit, delete, list, filter by status
- ⬜ Deployed to Vercel as two projects (Root Directory `frontend` and `backend`); environment variables set (me)
- ⬜ README final pass with the live link

## Next session: build the backend (handoff, 2026-11-12)
I chose to build the job-tracker backend now and leave Phase 0's Kancilink and ops-drills tasks for later.

Build order, all by Claude: Prisma 7.10.1 (latest stable; npm `latest` is an 8.0 RC) with schema + first migration (J11, J13) → Google ID-token verification → JWT in an `httpOnly` cookie + auth middleware (J10) → zod validation + error handler (J12) → applications CRUD + filter by status, scoped to the user → tests.

Environment variable names (I set the values myself):
- `backend/.env`: `DATABASE_URL` (Neon pooled), `DIRECT_URL` (Neon direct), `GOOGLE_CLIENT_ID`, `JWT_SECRET`
- `frontend/.env.local`: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `BACKEND_URL` (`http://localhost:4000` locally; the rewrite target)

## Later (outside the timebox)
- ⬜ Auto-import applications from LinkedIn, Glints, Indeed, JobStreet (likely by reading their "application sent" emails; see J14)
