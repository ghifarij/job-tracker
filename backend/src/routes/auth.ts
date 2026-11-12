import { Router } from "express";
import {
  type GoogleVerifier,
  requireAuth,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  sessionCookieOptions,
  signSession,
} from "../auth.js";
import type { Config } from "../config.js";
import { HttpError } from "../errors.js";
import { googleLoginSchema } from "../schemas.js";
import type { Store, User } from "../store.js";

type Deps = { config: Config; store: Store; verifyGoogleToken: GoogleVerifier };

function toJson(user: User) {
  return { id: user.id, email: user.email, name: user.name };
}

export function authRouter({ config, store, verifyGoogleToken }: Deps): Router {
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

  router.get("/me", requireAuth(config), async (_req, res) => {
    const user = await store.findUser(res.locals.userId);
    if (!user) {
      // A valid cookie for a user that no longer exists.
      res.clearCookie(SESSION_COOKIE, cookieOptions);
      throw new HttpError(401, "Not logged in");
    }
    res.json({ user: toJson(user) });
  });

  return router;
}
