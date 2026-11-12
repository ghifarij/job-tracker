import { describe, expect, it } from "vitest";
import { formatCalendarDate, parseCalendarDate, today } from "./calendarDate.js";
import { newApplication } from "./newApplication.js";

const input = { company: "Tokopedia", role: "Backend Engineer" };

describe("newApplication", () => {
  it("defaults to APPLIED, no link, no notes", () => {
    expect(newApplication(input)).toMatchObject({
      ...input,
      status: "APPLIED",
      link: null,
      notes: null,
    });
  });

  it("dates it today in Jakarta, not in UTC", () => {
    // 23:30 UTC on the 14th is 06:30 on the 15th in Jakarta (UTC+7).
    const application = newApplication(input, new Date("2026-11-14T23:30:00Z"));

    expect(formatCalendarDate(application.appliedAt)).toBe("2026-11-15");
  });

  it("keeps every field that was sent", () => {
    const full = {
      ...input,
      link: "https://example.com/jobs/1",
      status: "GHOSTED" as const,
      appliedAt: parseCalendarDate("2026-11-01"),
      notes: "Referred by a friend",
    };

    expect(newApplication(full, new Date("2026-11-14T23:30:00Z"))).toEqual(full);
  });
});

describe("calendar dates", () => {
  it("parse and format are each other's opposite", () => {
    expect(formatCalendarDate(parseCalendarDate("2026-02-28"))).toBe("2026-02-28");
  });

  it("today changes at midnight in Jakarta", () => {
    expect(formatCalendarDate(today(new Date("2026-11-14T16:59:00Z")))).toBe("2026-11-14");
    expect(formatCalendarDate(today(new Date("2026-11-14T17:00:00Z")))).toBe("2026-11-15");
  });
});
