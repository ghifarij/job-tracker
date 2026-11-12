// The one place the frontend talks to the backend, and the one place the JSON
// shapes are written down. Every request goes to /api/* on this site; Next.js
// passes it on to the Express backend (see next.config.ts).

export const STATUSES = ["APPLIED", "INTERVIEWED", "REJECTED", "GHOSTED"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  APPLIED: "Applied",
  INTERVIEWED: "Interviewed",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
};

export type User = {
  id: string;
  email: string;
  name: string | null;
};

export type Application = {
  id: string;
  company: string;
  role: string;
  link: string | null;
  status: Status;
  // A calendar date, "2026-11-15".
  appliedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// What the add and edit forms send.
export type ApplicationInput = Pick<
  Application,
  "company" | "role" | "link" | "status" | "appliedAt" | "notes"
>;

export type FieldErrors = Partial<Record<string, string[]>>;

// Any response that isn't 2xx. `status` is 0 when the server couldn't be
// reached at all.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields: FieldErrors = {},
  ) {
    super(message);
  }
}

// How long a request may take before the app stops waiting. The database
// sleeps when idle and its first answer after waking can be slow, so this is
// generous; without it a stuck request would leave the screen frozen.
const TIMEOUT_MS = 20_000;

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError(0, "The server is taking too long to answer. Try again.");
    }
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  // The backend always answers JSON. Anything else (an HTML error page from
  // the rewrite when the backend is down) becomes null here.
  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (json as { error?: { message?: string; fields?: FieldErrors } } | null)?.error;
    throw new ApiError(
      response.status,
      error?.message ?? "The server didn't answer properly. Try again in a moment.",
      error?.fields,
    );
  }

  return json as T;
}

// The logged-in user, or null when nobody is logged in.
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { user } = await request<{ user: User }>("GET", "/auth/me");
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

// `credential` is the ID token Google hands the browser. The backend verifies
// it and sets the session cookie.
export async function signInWithGoogle(credential: string): Promise<User> {
  const { user } = await request<{ user: User }>("POST", "/auth/google", { credential });
  return user;
}

export function signOut(): Promise<void> {
  return request("POST", "/auth/logout");
}

export function deleteAccount(): Promise<void> {
  return request("DELETE", "/auth/me");
}

export async function listApplications(status?: Status): Promise<Application[]> {
  const query = status ? `?status=${status}` : "";
  const { applications } = await request<{ applications: Application[] }>(
    "GET",
    `/applications${query}`,
  );
  return applications;
}

export async function createApplication(input: ApplicationInput): Promise<Application> {
  const { application } = await request<{ application: Application }>(
    "POST",
    "/applications",
    input,
  );
  return application;
}

export async function updateApplication(
  id: string,
  changes: Partial<ApplicationInput>,
): Promise<Application> {
  const { application } = await request<{ application: Application }>(
    "PATCH",
    `/applications/${id}`,
    changes,
  );
  return application;
}

export function deleteApplication(id: string): Promise<void> {
  return request("DELETE", `/applications/${id}`);
}
