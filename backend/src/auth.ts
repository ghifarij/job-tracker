import type { CookieOptions, RequestHandler, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import type { Config } from "./config.js";
import { HttpError } from "./errors.js";
import type { GoogleProfile, Store, User } from "./store.js";

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 7;

// Returns the Google account behind an ID token, or null if the token is not
// a valid one for this app. Tests pass in a fake.
export type GoogleVerifier = (idToken: string) => Promise<GoogleProfile | null>;

export function createGoogleVerifier(googleClientId: string): GoogleVerifier {
  const client = new OAuth2Client();

  return async (idToken) => {
    try {
      // Checks Google's signature, the expiry, and that the token was issued
      // for *this* app (audience). Without the audience check, a token a user
      // gave to any other site could be replayed here.
      const ticket = await client.verifyIdToken({ idToken, audience: googleClientId });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        return null;
      }
      return { googleId: payload.sub, email: payload.email, name: payload.name ?? null };
    } catch {
      return null;
    }
  };
}

export function signSession(userId: string, jwtSecret: string): string {
  return jwt.sign({}, jwtSecret, {
    subject: userId,
    algorithm: "HS256",
    expiresIn: `${SESSION_DAYS}d`,
  });
}

// Returns the user id, or null if the token is missing, forged or expired.
export function verifySession(token: unknown, jwtSecret: string): string | null {
  if (typeof token !== "string") {
    return null;
  }
  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    return typeof payload === "object" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

// J10: httpOnly keeps page scripts from reading the cookie; SameSite=Lax
// keeps other sites from sending it on their POST/PATCH/DELETE requests.
export function sessionCookieOptions(config: Config): CookieOptions {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    path: "/",
  };
}

export const SESSION_MAX_AGE_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

// A session is valid only while its user exists (J23): a correctly signed
// cookie is not enough once the account has been deleted. That costs one
// primary-key lookup per request.
export function requireAuth(config: Config, store: Store): RequestHandler {
  return async (req, res, next) => {
    const userId = verifySession(req.cookies?.[SESSION_COOKIE], config.jwtSecret);
    const user = userId ? await store.findUser(userId) : null;
    if (!user) {
      res.clearCookie(SESSION_COOKIE, sessionCookieOptions(config));
      throw new HttpError(401, "Not logged in");
    }
    res.locals.user = user;
    next();
  };
}

// The only way a route learns who is logged in. Express types res.locals as
// `any`, so reading it directly would let a missing user slip through as
// `undefined`, and Prisma treats `where: { userId: undefined }` as "no
// filter": every user's rows. This fails closed instead: a route that isn't
// behind requireAuth gets a 401, never an unscoped query.
export function currentUser(res: Response): User {
  const user: unknown = res.locals.user;
  if (!isUser(user)) {
    throw new HttpError(401, "Not logged in");
  }
  return user;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as User).id === "string" &&
    (value as User).id.length > 0
  );
}
