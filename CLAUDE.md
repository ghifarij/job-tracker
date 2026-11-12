# Job tracker

A personal job-application tracker. It's my backend/full-stack evidence for the ADI portfolio and replaces RekJobs. The shared rules in `../CLAUDE.md` apply here.

- Repo: `github.com/ghifarij/job-tracker` (public)
- Timebox: **2 days (15–16 Nov 2026).** When time runs out, cut features instead of extending the timebox.

## Stack and scope

- Next.js frontend + Express backend, both TypeScript.
- Postgres on Neon's free tier.
- Deployed to Vercel.
- **Google login, open to anyone.** Every query is scoped to the logged-in user, so each user sees only their own applications.
- Core features: add, edit and delete an application (company, role, link, status, dates, notes), list and filter by status.

## How work happens here

- Claude writes all the code and tests. I make every product and technical decision; Claude offers options with a recommendation.
- No review quiz and no LEARNING.md here. I already know this stack from Purwadhika, including Google login.
- I connect Vercel and Neon myself, and I set the environment variables and secrets myself.

## Portfolio claims

Only: Next.js, Express, TypeScript, Postgres, Google login, Vercel. No Docker or CI claims; those belong to Kancilink.

## Records

- `docs/PROGRESS.md`: tasks.
- `docs/DECISIONS.md`: numbered decisions with my reasons.
