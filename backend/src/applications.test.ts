import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp, loginAs } from "./test/testApp.js";
import { formatCalendarDate, today } from "./calendarDate.js";

const job = { company: "Tokopedia", role: "Backend Engineer" };

describe("applications need a login", () => {
  it.each([
    ["get", "/api/applications"],
    ["post", "/api/applications"],
    ["get", "/api/applications/7b0e7c9e-6f0e-4b61-9d57-0f4b8c1d2e3f"],
    ["patch", "/api/applications/7b0e7c9e-6f0e-4b61-9d57-0f4b8c1d2e3f"],
    ["delete", "/api/applications/7b0e7c9e-6f0e-4b61-9d57-0f4b8c1d2e3f"],
  ] as const)("%s %s is 401 without a cookie", async (method, path) => {
    const res = await request(createTestApp())[method](path);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/applications", () => {
  it("fills in the optional fields that are left out", async () => {
    const ana = await loginAs(createTestApp(), "ana");

    const res = await ana.post("/api/applications").send(job);

    expect(res.status).toBe(201);
    expect(res.body.application).toMatchObject({
      company: "Tokopedia",
      role: "Backend Engineer",
      link: null,
      status: "APPLIED",
      appliedAt: formatCalendarDate(today()),
      notes: null,
    });
    expect(res.body.application).not.toHaveProperty("userId");
  });

  it("stores every field that is sent", async () => {
    const ana = await loginAs(createTestApp(), "ana");
    const full = {
      ...job,
      link: "https://example.com/jobs/1",
      status: "INTERVIEWED",
      appliedAt: "2026-11-01",
      notes: "Referred by a friend",
    };

    const res = await ana.post("/api/applications").send(full);

    expect(res.status).toBe(201);
    expect(res.body.application).toMatchObject(full);
  });

  it("trims company and role", async () => {
    const ana = await loginAs(createTestApp(), "ana");

    const res = await ana.post("/api/applications").send({ company: "  Gojek ", role: " SRE " });

    expect(res.body.application).toMatchObject({ company: "Gojek", role: "SRE" });
  });

  it.each([
    ["a missing company", { role: "SRE" }, "company"],
    ["a blank role", { company: "Gojek", role: "   " }, "role"],
    ["an unknown status", { ...job, status: "OFFER" }, "status"],
    ["a date that is not YYYY-MM-DD", { ...job, appliedAt: "15/11/2026" }, "appliedAt"],
    ["a date that does not exist", { ...job, appliedAt: "2026-02-30" }, "appliedAt"],
    ["a link that is not http(s)", { ...job, link: "javascript:alert(1)" }, "link"],
  ])("rejects %s", async (_name, body, field) => {
    const ana = await loginAs(createTestApp(), "ana");

    const res = await ana.post("/api/applications").send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty(field);
  });

  it("rejects malformed JSON with a 400", async () => {
    const ana = await loginAs(createTestApp(), "ana");

    const res = await ana
      .post("/api/applications")
      .set("Content-Type", "application/json")
      .send("{not json");

    expect(res.status).toBe(400);
  });
});

describe("GET /api/applications", () => {
  it("lists newest applied first", async () => {
    const ana = await loginAs(createTestApp(), "ana");
    await ana.post("/api/applications").send({ ...job, company: "Old", appliedAt: "2026-10-01" });
    await ana.post("/api/applications").send({ ...job, company: "New", appliedAt: "2026-11-10" });

    const res = await ana.get("/api/applications");

    expect(res.status).toBe(200);
    expect(res.body.applications.map((a: { company: string }) => a.company)).toEqual([
      "New",
      "Old",
    ]);
  });

  it("filters by status", async () => {
    const ana = await loginAs(createTestApp(), "ana");
    await ana.post("/api/applications").send({ ...job, company: "A", status: "REJECTED" });
    await ana.post("/api/applications").send({ ...job, company: "B", status: "APPLIED" });

    const res = await ana.get("/api/applications?status=REJECTED");

    expect(res.body.applications).toHaveLength(1);
    expect(res.body.applications[0].company).toBe("A");
  });

  it("rejects an unknown status filter", async () => {
    const ana = await loginAs(createTestApp(), "ana");

    const res = await ana.get("/api/applications?status=OFFER");

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/applications/:id", () => {
  it("changes only the fields that are sent", async () => {
    const ana = await loginAs(createTestApp(), "ana");
    const created = await ana.post("/api/applications").send({ ...job, notes: "first" });
    const id = created.body.application.id;

    const res = await ana.patch(`/api/applications/${id}`).send({ status: "GHOSTED" });

    expect(res.status).toBe(200);
    expect(res.body.application).toMatchObject({ ...job, status: "GHOSTED", notes: "first" });
  });

  it("clears an optional field with null", async () => {
    const ana = await loginAs(createTestApp(), "ana");
    const created = await ana.post("/api/applications").send({ ...job, notes: "first" });

    const res = await ana
      .patch(`/api/applications/${created.body.application.id}`)
      .send({ notes: null });

    expect(res.body.application.notes).toBeNull();
  });

  it("rejects an empty change and a null company", async () => {
    const ana = await loginAs(createTestApp(), "ana");
    const created = await ana.post("/api/applications").send(job);
    const url = `/api/applications/${created.body.application.id}`;

    await ana.patch(url).send({}).expect(400);
    await ana.patch(url).send({ company: null }).expect(400);
  });

  it("is 404 for an unknown id and for an id that is not a UUID", async () => {
    const ana = await loginAs(createTestApp(), "ana");

    await ana
      .patch("/api/applications/7b0e7c9e-6f0e-4b61-9d57-0f4b8c1d2e3f")
      .send({ status: "GHOSTED" })
      .expect(404);
    await ana.patch("/api/applications/123").send({ status: "GHOSTED" }).expect(404);
  });
});

describe("DELETE /api/applications/:id", () => {
  it("deletes the application", async () => {
    const ana = await loginAs(createTestApp(), "ana");
    const created = await ana.post("/api/applications").send(job);
    const url = `/api/applications/${created.body.application.id}`;

    await ana.delete(url).expect(204);

    await ana.get(url).expect(404);
    await ana.delete(url).expect(404);
  });
});

describe("each user sees only their own applications", () => {
  async function setup() {
    const app = createTestApp();
    const ana = await loginAs(app, "ana");
    const budi = await loginAs(app, "budi");
    const created = await ana.post("/api/applications").send(job);
    return { ana, budi, url: `/api/applications/${created.body.application.id}` };
  }

  it("another user's list does not include it", async () => {
    const { budi } = await setup();

    const res = await budi.get("/api/applications");

    expect(res.body.applications).toEqual([]);
  });

  it("another user cannot read it", async () => {
    const { budi, url } = await setup();

    await budi.get(url).expect(404);
  });

  it("another user cannot edit it", async () => {
    const { ana, budi, url } = await setup();

    await budi.patch(url).send({ company: "Hacked" }).expect(404);

    const res = await ana.get(url);
    expect(res.body.application.company).toBe("Tokopedia");
  });

  it("another user cannot delete it", async () => {
    const { ana, budi, url } = await setup();

    await budi.delete(url).expect(404);

    await ana.get(url).expect(200);
  });

  it("a userId in the body does not move the application to someone else", async () => {
    const { ana, budi, url } = await setup();
    const budiId = (await budi.get("/api/auth/me")).body.user.id;

    await ana.patch(url).send({ userId: budiId, company: "Still mine" }).expect(200);

    await ana.get(url).expect(200);
    await budi.get(url).expect(404);
  });
});
