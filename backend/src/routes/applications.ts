import { Router } from "express";
import { requireAuth } from "../auth.js";
import type { Config } from "../config.js";
import { HttpError } from "../errors.js";
import {
  createApplicationSchema,
  idSchema,
  listApplicationsQuerySchema,
  updateApplicationSchema,
} from "../schemas.js";
import type { Application, Store } from "../store.js";
import { localDate } from "../today.js";

type Deps = { config: Config; store: Store };

function toJson(application: Application) {
  return {
    id: application.id,
    company: application.company,
    role: application.role,
    link: application.link,
    status: application.status,
    // A calendar date, not a moment in time: "2026-11-15".
    appliedAt: application.appliedAt.toISOString().slice(0, 10),
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

export function applicationsRouter({ config, store }: Deps): Router {
  const router = Router();

  // Everything below needs a login, and uses res.locals.userId in every query.
  router.use(requireAuth(config));

  router.get("/", async (req, res) => {
    const { status } = listApplicationsQuerySchema.parse(req.query);
    const applications = await store.listApplications(res.locals.userId, status);
    res.json({ applications: applications.map(toJson) });
  });

  router.post("/", async (req, res) => {
    const data = createApplicationSchema.parse(req.body);
    const application = await store.createApplication(res.locals.userId, {
      ...data,
      appliedAt: data.appliedAt ?? new Date(localDate()),
    });
    res.status(201).json({ application: toJson(application) });
  });

  router.get("/:id", async (req, res) => {
    const application = await store.getApplication(res.locals.userId, parseId(req.params.id));
    if (!application) {
      throw notFound();
    }
    res.json({ application: toJson(application) });
  });

  router.patch("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    const changes = updateApplicationSchema.parse(req.body);
    const application = await store.updateApplication(res.locals.userId, id, changes);
    if (!application) {
      throw notFound();
    }
    res.json({ application: toJson(application) });
  });

  router.delete("/:id", async (req, res) => {
    const deleted = await store.deleteApplication(res.locals.userId, parseId(req.params.id));
    if (!deleted) {
      throw notFound();
    }
    res.status(204).end();
  });

  return router;
}
