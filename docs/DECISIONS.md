# Job tracker: decisions

Every decision and my reason for it. To change a decision, add a new ID that says which one it revises.

J1–J7 were made in the planning sessions on 2026-11-11.

| ID | Decision | Why | Rejected |
|---|---|---|---|
| J1 | **Build a new job tracker; drop RekJobs from the portfolio** | RekJobs' AWS/Terraform setup was configured by Claude and its deploy workflow is broken, so I couldn't defend it | Fixing RekJobs |
| J2 | **Next.js + Express, TypeScript** | My Purwadhika stack: I can explain it fully, and it bridges my full-stack experience to Kancilink | A new stack (Kancilink already covers the new language) |
| J3 | **Postgres on Neon's free tier** | Free, managed, and Postgres is what I know | Supabase, SQLite |
| J4 | **Vercel hosting** | Free and fast. Here the app is the point, not the operations; Kancilink is where I run my own server | A VM (that's Kancilink's job) |
| J5 | **Google login, open to anyone; each user sees only their own data** | No passwords to store; anyone can try it safely | Login for me only; no login |
| J6 | **Claude writes the code, I make the decisions; 2-day timebox** | It's supporting evidence; my DevOps time goes to Kancilink | Building it by hand |
| J7 | **Portfolio claims: Next.js, Express, TypeScript, Postgres, Google login, Vercel only** | No Docker or CI claims, so it never overlaps with what Kancilink must prove | Adding Docker/CI here |
| J8 | **One repo, two folders: `frontend/` (Next.js) and `backend/` (Express), each with its own `package.json`, no workspaces** | One link for reviewers; a feature that touches API and UI lands in one commit; no workspace tooling to set up or defend in a 2-day timebox | Separate repos; npm workspaces with a shared types package |
| J9 | **Express runs as its own Vercel project; two Vercel projects from this repo (Root Directory `frontend` and `backend`)** | Keeps the backend a real standalone API that deploys on its own, instead of hiding it inside a Next.js route | Express mounted inside a Next.js API route (one deploy) |
| J10 | **Login: the frontend gets a Google ID token; the backend verifies it with `verifyIdToken` and sets its own JWT in an `httpOnly`, `Secure`, `SameSite=Lax` cookie. Next.js rewrites `/api/*` to the backend, so the browser sees one site** | Safer: page scripts can't read an `httpOnly` cookie, so an XSS bug can't steal the session. The rewrite is needed because browsers treat `vercel.app` as a public suffix, so two `*.vercel.app` projects are different sites and the cookie could be blocked | A: Bearer JWT that frontend scripts can read (simpler, but XSS can steal it) |
| J11 | **Prisma ORM on Neon Postgres: pooled URL for the app, direct URL for migrations** | I used Prisma at Purwadhika and in RekJobs, so I can explain it; its migrations show how the schema changed, and the generated types catch query mistakes | Raw `pg`; Drizzle |
| J12 | **zod for request validation** | One zod schema both validates the request body and gives the TypeScript type, so the two can't drift apart | `express-validator` (RekJobs installed it and never used it); hand-written checks |
| J13 | **An application has: company, role, link (optional), status, `appliedAt` (defaults to today), notes (optional). Statuses: `APPLIED`, `INTERVIEWED`, `REJECTED`, `GHOSTED`** | The app is for me first: I just don't want to forget what I applied to and at which company. Four statuses cover what I actually track; adding one later is a one-line migration | Wishlist/Offer/Withdrawn stages; a second `nextStepAt` date |
| J14 | **Entry is manual for now. No `source` column until auto-import is built** | Keep the 2-day scope small. Auto-import from LinkedIn, Glints, Indeed and JobStreet is a later idea; none of them has a public API for my own applications, so it would likely mean reading their "application sent" emails. A migration can add `source` then | Adding `source` now |
