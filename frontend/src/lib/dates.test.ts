import { describe, expect, it } from "vitest";
import { daysAgo, formatDate, todayLocal } from "./dates";

describe("todayLocal", () => {
  it("uses the local calendar day, zero-padded", () => {
    // Built from local parts, so this holds in any time zone.
    expect(todayLocal(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

describe("formatDate", () => {
  it("writes the day the API sent, whatever the viewer's time zone", () => {
    expect(formatDate("2026-11-15")).toBe("15 Nov 2026");
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
  });
});

describe("daysAgo", () => {
  it("names today, yesterday and tomorrow", () => {
    expect(daysAgo("2026-11-15", "2026-11-15")).toBe("today");
    expect(daysAgo("2026-11-14", "2026-11-15")).toBe("yesterday");
    expect(daysAgo("2026-11-16", "2026-11-15")).toBe("tomorrow");
  });

  it("counts whole days across a month boundary", () => {
    expect(daysAgo("2026-10-30", "2026-11-02")).toBe("3 days ago");
  });

  it("handles a date in the future", () => {
    expect(daysAgo("2026-11-20", "2026-11-15")).toBe("in 5 days");
  });
});
