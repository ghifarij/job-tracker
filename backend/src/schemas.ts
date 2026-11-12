import { z } from "zod";
import { parseCalendarDate } from "./calendarDate.js";
import { STATUSES } from "./store.js";

export const googleLoginSchema = z.object({
  // The ID token from Google Identity Services ("credential" is their name).
  credential: z.string().min(1),
});

const applicationFields = {
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  // http(s) only: the frontend renders this as a link, and a `javascript:`
  // URL there would run script on click.
  link: z.httpUrl().max(2000).nullable(),
  status: z.enum(STATUSES),
  // A calendar date, "2026-11-15". Stored in a Postgres DATE column.
  appliedAt: z.iso.date().transform(parseCalendarDate),
  notes: z.string().trim().max(5000).nullable(),
};

// Unknown keys (a smuggled `userId`, for one) are dropped by z.object.
export const createApplicationSchema = z.object({
  company: applicationFields.company,
  role: applicationFields.role,
  link: applicationFields.link.optional(),
  status: applicationFields.status.optional(),
  appliedAt: applicationFields.appliedAt.optional(),
  notes: applicationFields.notes.optional(),
});

// What a create request holds after validation: the optional fields may be
// missing. src/newApplication.ts turns this into a complete record.
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = z
  .object(applicationFields)
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Send at least one field to change",
  });

export const listApplicationsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
});

export const idSchema = z.uuid();
