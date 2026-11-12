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

## Design

The look is "airmail": cool paper, navy ink, the red of the envelope stripe, narrow Bricolage headings. Every UI edit follows these rules, however small.

- **Read `frontend/src/app/globals.css` before changing any UI.** It is the source of truth for the look.
- **Colours and fonts come from the `@theme` tokens only.** No raw hex values and no new colours or fonts in components. A new token needs my approval.
- **Reuse the existing classes before writing new ones:** `.btn`, `.btn-primary`, `.btn-danger`, `.link-btn`, `.link-btn-danger`, `.icon-btn`, `.field*`, `.status`, `.modal`, `.display`. A new class goes in `globals.css` with a comment saying what it is for.
- **Red means "Rejected" or deleting.** Nothing else is red.
- **One primary button (`.btn-primary`) per screen,** and one way to reach each action: no duplicate buttons for the same thing.
- **The airmail stripe appears once per screen, at the top.**
- **Forms open in a centred dialog; Settings opens in the drawer.** Both go through `Modal`.
- **Headings and company names use `.display`.** Body text stays at the default width.
- **Symbol-only buttons use `.icon-btn` and carry an `aria-label`.**
- **A change that breaks one of these rules is a decision:** ask me first, then record it in `docs/DECISIONS.md`.
- The `frontend-design` skill is for new screens only, and it works inside the airmail look. Don't use it for small edits.

## Portfolio claims

Only: Next.js, Express, TypeScript, Postgres, Google login, Vercel. No Docker or CI claims; those belong to Kancilink.

## Records

- `docs/PROGRESS.md`: tasks.
- `docs/DECISIONS.md`: numbered decisions with my reasons.
