# Job tracker

A personal tracker for job applications: log each application, update its status, and see where every one stands. Sign in with Google; each user sees only their own data.

> **Status:** planned for 15–16 Nov 2026.

## Stack

| Tool | Why |
|---|---|
| Next.js (TypeScript) | Frontend |
| Express (TypeScript) | REST API |
| Postgres (Neon) | Stores applications per user; free tier |
| Google login | No passwords to store; quick sign-in |
| Vercel | Free hosting for the app |

## How this was built

| Part | Done by |
|---|---|
| Code and tests | Claude (AI), reviewed by me |
| Product and technical decisions (`docs/DECISIONS.md`) | Me |
| Vercel and Neon setup, environment variables, Google OAuth setup | Me |
