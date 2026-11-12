import { defineConfig } from "prisma/config";
import { loadEnvFiles } from "./src/loadEnvFiles.ts";

loadEnvFiles();

// Used by the Prisma CLI only (migrate, generate, studio). Migrations need a
// direct connection, so the CLI gets Neon's unpooled URL. The running app
// connects through the pooled DATABASE_URL instead (see src/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
