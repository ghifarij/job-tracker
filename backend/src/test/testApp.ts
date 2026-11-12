import request from "supertest";
import type { GoogleVerifier } from "../auth.js";
import type { Config } from "../config.js";
import { createApp } from "../createApp.js";
import { createMemoryStore } from "./memoryStore.js";

export const testConfig: Config = {
  databaseUrl: "unused-in-tests",
  googleClientId: "test-client-id",
  jwtSecret: "test-secret-that-is-at-least-32-chars",
  cookieSecure: false,
};

// Stands in for Google: "token-for-ana" is Ana's valid ID token, and
// anything that doesn't start with "token-for-" is rejected.
const fakeVerifier: GoogleVerifier = async (idToken) => {
  const name = /^token-for-(\w+)$/.exec(idToken)?.[1];
  return name ? { googleId: `google-${name}`, email: `${name}@example.com`, name } : null;
};

export function createTestApp(configOverrides: Partial<Config> = {}) {
  return createApp({
    config: { ...testConfig, ...configOverrides },
    store: createMemoryStore(),
    verifyGoogleToken: fakeVerifier,
  });
}

// A supertest agent keeps cookies between requests, like a browser does.
export async function loginAs(app: ReturnType<typeof createTestApp>, name: string) {
  const agent = request.agent(app);
  await agent.post("/api/auth/google").send({ credential: `token-for-${name}` }).expect(200);
  return agent;
}
