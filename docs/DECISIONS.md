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
