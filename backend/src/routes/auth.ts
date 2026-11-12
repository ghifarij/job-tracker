import { Router } from "express";
import {
  currentUser,
  requireAuth,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  sessionCookieOptions,
  signSession,
} from "../auth.js";
import type { AppDeps } from "../createApp.js";
import { HttpError } from "../errors.js";
import { googleLoginSchema } from "../schemas.js";
import type { User } from "../store.js";

function toJson(user: User) {
  return { id: user.id, email: user.email, name: user.name };
}

export function authRouter({ config, store, verifyGoogleToken }: AppDeps): Router {
  const router = Router();
  const cookieOptions = sessionCookieOptions(config);

  // The body carries only Google's ID token. Who the user is comes from
  // verifying that token, never from fields the client fills in.
  router.post("/google", async (req, res) => {
    const { credential } = googleLoginSchema.parse(req.body);

    const profile = await verifyGoogleToken(credential);
    if (!profile) {
      throw new HttpError(401, "Invalid Google credential");
    }

    const user = await store.upsertUser(profile);
    res.cookie(SESSION_COOKIE, signSession(user.id, config.jwtSecret), {
      ...cookieOptions,
      maxAge: SESSION_MAX_AGE_MS,
    });
    res.json({ user: toJson(user) });
  });

  router.post("/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.status(204).end();
  });

  router.get("/me", requireAuth(config, store), (_req, res) => {
    res.json({ user: toJson(currentUser(res)) });
  });

  return router;
}
