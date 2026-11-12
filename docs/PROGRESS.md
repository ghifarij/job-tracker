# Job tracker: progress

Status legend: ⬜ todo · 🟡 in progress · ✅ done · ⛔ blocked

## Phase 0: Setup (11–14 Nov)
- ✅ `CLAUDE.md`, README, docs written by Claude (2026-11-11)
- ✅ `git init` (me), `.gitignore` + first commit (Claude, 2026-11-12)
- ✅ Push to `ghifarij/job-tracker` (me, 2026-11-12)

## Phase 1: Build (15–16 Nov)
- ✅ Decide the repo layout and how Express runs on Vercel (J8, J9; 2026-11-12)
- ✅ Scaffold `frontend/` (Next.js) and `backend/` (Express + `/health` + test) (Claude, 2026-11-12)
- ✅ Decide how login works across the two domains, the database access and validation (J10–J12; 2026-11-12). Reviewed RekJobs' backend first: its Google login trusted `googleId`/`email` from the request body without verifying the token. Don't repeat that.
- ✅ Decide the application fields and status values (J13, J14; 2026-11-12)
- ⬜ Google OAuth client created in Google Cloud Console (me)
- ✅ Neon project `solitary-salad-07888565` linked with `neon link` from `backend/` (2026-11-12). Pulled into `backend/.env.local`; `.neon` and `.env.local` are git-ignored by `backend/.gitignore`
- 🟡 Google login + per-user data scoping: backend done (Claude, 2026-11-12); frontend not started
- 🟡 Applications: add, edit, delete, list, filter by status: backend done (Claude, 2026-11-12); frontend not started
- ✅ First migration applied with `npm run db:deploy` (me, 2026-11-12). Claude then ran the real Prisma queries once against Neon with two throwaway users (create, list, filter, update, delete, cross-user access refused) and deleted them
- ⬜ Deployed to Vercel as two projects (Root Directory `frontend` and `backend`); environment variables set (me)
- ⬜ README final pass with the live link

## Backend build (Claude, 2026-11-12)
Built in the order of the handoff: Prisma schema + first migration → Google ID-token verification → JWT cookie + auth middleware → zod validation + error handler → applications CRUD + status filter → tests (`npm test`, no database needed).

API, all under `/api` (the frontend rewrite keeps the path unchanged):
- `POST /api/auth/google` `{ credential }` → sets the `session` cookie, returns `{ user }`
- `POST /api/auth/logout` → 204
- `GET /api/auth/me` → `{ user }` or 401
- `GET /api/applications?status=` → `{ applications }`, newest `appliedAt` first
- `POST /api/applications` → 201 `{ application }`
- `GET | PATCH | DELETE /api/applications/:id`
- Errors: `{ error: { message, fields? } }`. Dates: `appliedAt` is `"YYYY-MM-DD"`

Environment variables (I set the values myself):
- `backend/.env.local` (written by `neon link`): `DATABASE_URL` (pooled, the app), `DATABASE_URL_UNPOOLED` (direct, Prisma CLI)
- `backend/.env`: `GOOGLE_CLIENT_ID`, `JWT_SECRET` (32+ characters, or the app refuses to start)
- Vercel backend project: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`
- `frontend/.env.local`: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `BACKEND_URL` (`http://localhost:4000` locally; the rewrite target)

The choices Claude made while building were confirmed or changed by me on 2026-11-12: J15–J21 in `DECISIONS.md`.

## Architecture review (Claude, 2026-11-12)
Reviewed the backend before starting the frontend; I picked candidates 1 and 2 (J22, J23).
- ✅ New-application rules in `src/newApplication.ts`; calendar dates in `src/calendarDate.ts`; the stores no longer hold defaults
- ✅ `currentUser(res)` is the only way a route reads the logged-in user; the login check confirms the user still exists
- ⬜ Apply the second migration (drops the two database defaults): `cd backend && npm run db:deploy` (me)
- Not done, on purpose: writing the JSON shapes down in one types file (candidate 3; worth doing when the frontend starts) and running the store tests against Postgres (candidate 4; contradicts J20)

## Next session: build the frontend
Login page with the Google button → rewrite `/api/*` to `BACKEND_URL` → applications list with status filter → add / edit / delete forms.

## Later (outside the timebox)
- ⬜ Auto-import applications from LinkedIn, Glints, Indeed, JobStreet (likely by reading their "application sent" emails; see J14)
