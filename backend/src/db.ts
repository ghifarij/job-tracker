import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

// Prisma 7 talks to Postgres through a driver adapter. The app uses Neon's
// pooled URL: each Vercel function instance opens its own connections, and
// the pooler keeps them from exhausting Postgres' connection limit.
export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}
