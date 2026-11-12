// A calendar date ("2026-11-15") has no time and no time zone. Everywhere in
// this app it is carried as a JavaScript Date at midnight UTC of that day,
// which is also how Prisma reads and writes a Postgres DATE column. This
// file is the only place that knows that convention.

// Used when a request doesn't say which day it is. Vercel's servers run on
// UTC, where an application entered at 06:00 in Jakarta would be dated
// yesterday (J21).
const DEFAULT_TIME_ZONE = "Asia/Jakarta";

// "2026-11-15" → the Date that stands for that day.
export function parseCalendarDate(text: string): Date {
  return new Date(`${text}T00:00:00Z`);
}

// The Date that stands for a day → "2026-11-15".
export function formatCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// The calendar date it is right now in the given time zone.
export function today(now: Date = new Date(), timeZone = DEFAULT_TIME_ZONE): Date {
  // The en-CA locale formats dates as YYYY-MM-DD.
  return parseCalendarDate(new Intl.DateTimeFormat("en-CA", { timeZone }).format(now));
}
