// The data the routes need, described without Prisma. The real implementation
// is src/prismaStore.ts; tests use an in-memory one (src/test/memoryStore.ts).
//
// Every application method takes the userId first. That is the per-user
// scoping rule: there is no way to read or change an application without
// saying whose it must be.

export const STATUSES = ["APPLIED", "INTERVIEWED", "REJECTED", "GHOSTED"] as const;
export type Status = (typeof STATUSES)[number];

export type User = {
  id: string;
  googleId: string;
  email: string;
  name: string | null;
};

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string | null;
};

export type Application = {
  id: string;
  userId: string;
  company: string;
  role: string;
  link: string | null;
  status: Status;
  appliedAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewApplication = {
  company: string;
  role: string;
  link?: string | null;
  // Left out: the database default applies (APPLIED).
  status?: Status;
  // The route always fills this in (see src/today.ts).
  appliedAt?: Date;
  notes?: string | null;
};

export type ApplicationChanges = Partial<NewApplication>;

export type Store = {
  // Creates the user on first login; refreshes email and name after that.
  upsertUser(profile: GoogleProfile): Promise<User>;
  findUser(id: string): Promise<User | null>;

  listApplications(userId: string, status?: Status): Promise<Application[]>;
  getApplication(userId: string, id: string): Promise<Application | null>;
  createApplication(userId: string, data: NewApplication): Promise<Application>;
  // null / false: no application with that id belongs to this user.
  updateApplication(
    userId: string,
    id: string,
    changes: ApplicationChanges,
  ): Promise<Application | null>;
  deleteApplication(userId: string, id: string): Promise<boolean>;
};
