import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { signSession } from "./auth.js";
import { loadConfig } from "./config.js";
import { createTestApp, loginAs, testConfig } from "./test/testApp.js";

describe("POST /api/auth/google", () => {
  it("logs in with a valid Google token and sets an httpOnly session cookie", async () => {
    const res = await request(createTestApp())
      .post("/api/auth/google")
      .send({ credential: "token-for-ana" });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: "ana@example.com", name: "ana" });

    const cookie = res.get("Set-Cookie")?.[0] ?? "";
    expect(cookie).toMatch(/^session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it("marks the cookie Secure in production", async () => {
    const config = loadConfig({
      DATABASE_URL: "x",
      GOOGLE_CLIENT_ID: "x",
      JWT_SECRET: testConfig.jwtSecret,
      NODE_ENV: "production",
    });

    expect(config.cookieSecure).toBe(true);
  });

  it("rejects a token Google would not verify", async () => {
    const res = await request(createTestApp())
      .post("/api/auth/google")
      .send({ credential: "forged" });

    expect(res.status).toBe(401);
    expect(res.get("Set-Cookie")).toBeUndefined();
  });

  it("ignores identity fields in the body: only the token counts", async () => {
    // RekJobs trusted googleId/email from the body. This must not log in.
    const res = await request(createTestApp())
      .post("/api/auth/google")
      .send({ googleId: "google-ana", email: "ana@example.com" });

    expect(res.status).toBe(400);
    expect(res.get("Set-Cookie")).toBeUndefined();
  });

  it("gives the same user on a second login", async () => {
    const app = createTestApp();
    const first = await request(app).post("/api/auth/google").send({ credential: "token-for-ana" });
    const second = await request(app).post("/api/auth/google").send({ credential: "token-for-ana" });

    expect(second.body.user.id).toBe(first.body.user.id);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the logged-in user", async () => {
    const agent = await loginAs(createTestApp(), "ana");

    const res = await agent.get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("ana@example.com");
  });

  it("is 401 without a cookie", async () => {
    const res = await request(createTestApp()).get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("is 401 for a cookie signed with another secret", async () => {
    const forged = signSession("some-user-id", "a-different-secret-of-32-chars-or-more");

    const res = await request(createTestApp())
      .get("/api/auth/me")
      .set("Cookie", `session=${forged}`);

    expect(res.status).toBe(401);
  });

  it("is 401 for an expired session", async () => {
    const expired = jwt.sign({}, testConfig.jwtSecret, { subject: "some-user-id", expiresIn: -10 });

    const res = await request(createTestApp())
      .get("/api/auth/me")
      .set("Cookie", `session=${expired}`);

    expect(res.status).toBe(401);
  });

  it("is 401 for an unsigned (alg: none) token", async () => {
    const unsigned = jwt.sign({}, "", { subject: "some-user-id", algorithm: "none" });

    const res = await request(createTestApp())
      .get("/api/auth/me")
      .set("Cookie", `session=${unsigned}`);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session", async () => {
    const agent = await loginAs(createTestApp(), "ana");

    await agent.post("/api/auth/logout").expect(204);

    await agent.get("/api/auth/me").expect(401);
  });
});

describe("loadConfig", () => {
  it("names the variables that are missing or too short", () => {
    expect(() => loadConfig({ DATABASE_URL: "x", JWT_SECRET: "short" })).toThrow(
      /GOOGLE_CLIENT_ID, JWT_SECRET/,
    );
  });
});
