// Calendar dates on the frontend. The API sends and expects "2026-11-15": a
// day, with no time and no time zone.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// "2026-11-15" → that day at midnight UTC. Only used for arithmetic and
// formatting, always read back in UTC, so the viewer's time zone can't shift
// the day.
function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

// The calendar date it is right now where the user is.
export function todayLocal(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// "2026-11-15" → "15 Nov 2026"
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUtc(date));
}

// How long ago `date` was, counted in whole days from `today`.
export function daysAgo(date: string, today: string): string {
  const days = Math.round((toUtc(today).getTime() - toUtc(date).getTime()) / MS_PER_DAY);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days === -1) return "tomorrow";
  if (days < 0) return `in ${-days} days`;
  return `${days} days ago`;
}
