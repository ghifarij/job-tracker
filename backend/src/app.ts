import { createGoogleVerifier } from "./auth.js";
import { loadConfig } from "./config.js";
import { createApp } from "./createApp.js";
import { createPrismaClient } from "./db.js";
import { loadEnvFiles } from "./loadEnvFiles.js";
import { createPrismaStore } from "./prismaStore.js";

// Vercel finds this file (src/app.ts) and serves the default export as one
// serverless function. Local development starts it from src/dev.ts instead.
loadEnvFiles();
const config = loadConfig();

const app = createApp({
  config,
  store: createPrismaStore(createPrismaClient(config.databaseUrl)),
  verifyGoogleToken: createGoogleVerifier(config.googleClientId),
});

export default app;
