import { today } from "./calendarDate.js";
import type { CreateApplicationInput } from "./schemas.js";
import type { NewApplication } from "./store.js";

// The rules for a new application (J13, J21, J22): whatever the request left
// out is decided here, and nowhere else. The store and the database have no
// defaults of their own, so anything that creates an application has to come
// through this function.
export function newApplication(input: CreateApplicationInput, now: Date = new Date()): NewApplication {
  return {
    company: input.company,
    role: input.role,
    link: input.link ?? null,
    status: input.status ?? "APPLIED",
    appliedAt: input.appliedAt ?? today(now),
    notes: input.notes ?? null,
  };
}
