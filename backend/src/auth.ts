import type { CookieOptions, RequestHandler } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import type { Config } from "./config.js";
import { HttpError } from "./errors.js";
import type { GoogleProfile } from "./store.js";

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

// Routes behind this middleware read the user from res.locals.userId. The id
// comes from the signed cookie only, never from the request body or URL.
export function requireAuth(config: Config): RequestHandler {
  return (req, res, next) => {
    const userId = verifySession(req.cookies?.[SESSION_COOKIE], config.jwtSecret);
    if (!userId) {
      throw new HttpError(401, "Not logged in");
    }
    res.locals.userId = userId;
    next();
  };
}
