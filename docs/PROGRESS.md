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
- 🟡 Google login + per-user data scoping: backend and frontend done (Claude, 2026-11-12); not yet tried with a real Google account (needs the OAuth client and the backend running)
- ✅ Applications: add, edit, delete, list, filter by status: backend and frontend done (Claude, 2026-11-12)
- ✅ First migration applied with `npm run db:deploy` (me, 2026-11-12). Claude then ran the real Prisma queries once against Neon with two throwaway users (create, list, filter, update, delete, cross-user access refused) and deleted them
- ✅ Delete my account (J24): backend done; the button and its confirm step are in the Settings drawer (Claude, 2026-11-12)
- ⬜ Deployed to Vercel as two projects (Root Directory `frontend` and `backend`); environment variables set (me)
- ⬜ README final pass with the live link

## Backend build (Claude, 2026-11-12)
Built in the order of the handoff: Prisma schema + first migration → Google ID-token verification → JWT cookie + auth middleware → zod validation + error handler → applications CRUD + status filter → tests (`npm test`, no database needed).

API, all under `/api` (the frontend rewrite keeps the path unchanged):
- `POST /api/auth/google` `{ credential }` → sets the `session` cookie, returns `{ user }`
- `POST /api/auth/logout` → 204
- `GET /api/auth/me` → `{ user }` or 401
- `DELETE /api/auth/me` → 204; deletes the account and all its applications (J24)
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
- ✅ Second migration applied (drops the two database defaults): `npm run db:deploy` (me, 2026-11-12)
- Not done, on purpose: writing the JSON shapes down in one types file (candidate 3; worth doing when the frontend starts) and running the store tests against Postgres (candidate 4; contradicts J20)

## Frontend build (Claude, 2026-11-12)
One page (`/`). `src/components/App.tsx` asks `GET /api/auth/me` and shows either the sign-in screen or the tracker.

- `next.config.ts`: rewrites `/api/*` to `BACKEND_URL` (J10); refuses to start if the variable is missing
- `src/lib/api.ts`: every backend call and the JSON shapes in one file (candidate 3 of the architecture review)
- `src/lib/dates.ts` + test: calendar dates ("12 Nov 2026", "3 days ago")
- `src/components/`: `SignIn` + `GoogleButton` (Google Identity Services), `Tracker` (list, status filter, status change in the row, Settings drawer), `ApplicationForm` (add / edit / delete in a dialog), `Modal`
- `frontend/.env.example`: the two variable names
- Checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all pass. Looked at every screen (desktop and phone width) against the backend's in-memory test app. Not checked: a real Google sign-in, and the real backend on Neon

Choices Claude made while building, for me to confirm or change (then they go into `DECISIONS.md`):
1. **The page is client-rendered and calls the API from the browser.** No server components fetching data, no server actions. The session cookie lives in the browser, so the browser makes the calls.
2. **The status filter asks the backend (`?status=`)** rather than loading everything and filtering in the browser. After every add, edit or delete the list is loaded again instead of being patched in place.
3. **The status can be changed straight from the list** (the status pill is a dropdown), without opening the edit form.
4. **Add and edit share one form in a native `<dialog>`**; deleting an application is inside the edit form, behind a second click.
5. **Look: "airmail".** Pale blue paper, navy ink, red only for Rejected and for deleting, an airmail stripe across the top, one typeface (Bricolage Grotesque). Light mode only.
6. **vitest added to the frontend** for the date helpers, and `@types/node` raised from 20 to 24 (vitest needs it; matches the backend's Node 24).
7. **The scaffold's five SVGs in `public/` are deleted.**

Settings drawer (my request, 2026-11-12): the navbar has one "Settings" button. It opens a drawer from the right with a Profile section (name, email, "Signed in with Google"), the Sign out button, and "Delete account" at the bottom behind a confirm step. Sign out and delete are no longer anywhere else on the page.

UI tidy-up (my request, 2026-11-12): the drawer closes with a × instead of the word "Close"; "Add application" is now only the button beside the "Applications" heading (the second one in the empty list is gone). The design rules are written down in `CLAUDE.md` (J25).

## Next session
Try the whole flow locally with a real Google account (backend on :4000, frontend on :3000) → deploy both Vercel projects (me) → README final pass.

## Later (outside the timebox)
- ⬜ Auto-import applications from LinkedIn, Glints, Indeed, JobStreet (likely by reading their "application sent" emails; see J14)
