import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./test/testApp.js";

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request(createTestApp()).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("unknown routes", () => {
  it("returns a JSON 404", async () => {
    const res = await request(createTestApp()).get("/nope");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Not found" } });
  });
});
