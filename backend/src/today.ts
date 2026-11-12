// The app's "today" when a request doesn't send a date. Vercel's servers run
// on UTC, where an application entered at 06:00 in Jakarta would be dated
// yesterday. The frontend normally sends the browser's local date; this is
// the fallback (J21).
const DEFAULT_TIME_ZONE = "Asia/Jakarta";

// "2026-11-15" for the given moment in the given time zone.
export function localDate(now: Date = new Date(), timeZone = DEFAULT_TIME_ZONE): string {
  // The en-CA locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}
