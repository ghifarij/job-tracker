import { Router } from "express";
import { currentUser, requireAuth } from "../auth.js";
import { formatCalendarDate } from "../calendarDate.js";
import type { AppDeps } from "../createApp.js";
import { HttpError } from "../errors.js";
import { newApplication } from "../newApplication.js";
import {
  createApplicationSchema,
  idSchema,
  listApplicationsQuerySchema,
  updateApplicationSchema,
} from "../schemas.js";
import type { Application } from "../store.js";

function toJson(application: Application) {
  return {
    id: application.id,
    company: application.company,
    role: application.role,
    link: application.link,
    status: application.status,
    // A calendar date, not a moment in time: "2026-11-15".
    appliedAt: formatCalendarDate(application.appliedAt),
    notes: application.notes,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

// An id that isn't a UUID can't match any row, so it is a 404 like any other
// unknown id. Someone else's application is also a 404, not a 403: the
// response doesn't reveal that the id exists.
function parseId(raw: unknown): string {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) {
    throw notFound();
  }
  return parsed.data;
}

function notFound(): HttpError {
  return new HttpError(404, "Application not found");
}

export function applicationsRouter({ config, store }: Pick<AppDeps, "config" | "store">): Router {
  const router = Router();

  // Everything below needs a login, and passes currentUser(res).id to every
  // store call.
  router.use(requireAuth(config, store));

  router.get("/", async (req, res) => {
    const { status } = listApplicationsQuerySchema.parse(req.query);
    const applications = await store.listApplications(currentUser(res).id, status);
    res.json({ applications: applications.map(toJson) });
  });

  router.post("/", async (req, res) => {
    const input = createApplicationSchema.parse(req.body);
    const application = await store.createApplication(currentUser(res).id, newApplication(input));
    res.status(201).json({ application: toJson(application) });
  });

  router.get("/:id", async (req, res) => {
    const application = await store.getApplication(currentUser(res).id, parseId(req.params.id));
    if (!application) {
      throw notFound();
    }
    res.json({ application: toJson(application) });
  });

  router.patch("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    const changes = updateApplicationSchema.parse(req.body);
    const application = await store.updateApplication(currentUser(res).id, id, changes);
    if (!application) {
      throw notFound();
    }
    res.json({ application: toJson(application) });
  });

  router.delete("/:id", async (req, res) => {
    const deleted = await store.deleteApplication(currentUser(res).id, parseId(req.params.id));
    if (!deleted) {
      throw notFound();
    }
    res.status(204).end();
  });

  return router;
}
