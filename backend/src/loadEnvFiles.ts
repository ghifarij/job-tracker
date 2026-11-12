import { existsSync } from "node:fs";

// Loads backend/.env.local (written by `neon link`) and backend/.env (my own
// values) into process.env. Variables that are already set are left alone.
// On Vercel neither file exists: the values come from the project settings.
export function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
    }
  }
}
