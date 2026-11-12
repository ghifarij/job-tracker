import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import type { GoogleVerifier } from "./auth.js";
import type { Config } from "./config.js";
import { errorHandler, notFoundHandler } from "./errors.js";
import { applicationsRouter } from "./routes/applications.js";
import { authRouter } from "./routes/auth.js";
import type { Store } from "./store.js";

export type AppDeps = {
  config: Config;
  store: Store;
  verifyGoogleToken: GoogleVerifier;
};

// Builds the Express app from its dependencies. src/app.ts passes the real
// ones (Neon, Google); tests pass an in-memory store and a fake verifier.
export function createApp(deps: AppDeps): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // The frontend rewrites /api/* to this backend with the path unchanged
  // (J10), so the routes live under /api here too.
  app.use("/api/auth", authRouter(deps));
  app.use("/api/applications", applicationsRouter(deps));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
