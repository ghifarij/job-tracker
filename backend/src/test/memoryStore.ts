import { randomUUID } from "node:crypto";
import type { Application, Store, User } from "../store.js";

// A Store that keeps everything in arrays, so route tests run without a
// database. It follows the same rules as src/prismaStore.ts: newest first,
// and every lookup matched on userId.
export function createMemoryStore(): Store {
  let users: User[] = [];
  let applications: Application[] = [];

  const find = (userId: string, id: string) =>
    applications.find((a) => a.id === id && a.userId === userId) ?? null;

  return {
    async upsertUser({ googleId, email, name }) {
      let user = users.find((u) => u.googleId === googleId);
      if (user) {
        user.email = email;
        user.name = name;
      } else {
        user = { id: randomUUID(), googleId, email, name };
        users.push(user);
      }
      return user;
    },

    async findUser(id) {
      return users.find((u) => u.id === id) ?? null;
    },

    async deleteUser(id) {
      users = users.filter((u) => u.id !== id);
      // What `onDelete: Cascade` does in Postgres.
      applications = applications.filter((a) => a.userId !== id);
    },

    async listApplications(userId, status) {
      return applications
        .filter((a) => a.userId === userId && (!status || a.status === status))
        .sort(
          (a, b) =>
            b.appliedAt.getTime() - a.appliedAt.getTime() ||
            b.createdAt.getTime() - a.createdAt.getTime(),
        );
    },

    async getApplication(userId, id) {
      return find(userId, id);
    },

    async createApplication(userId, data) {
      const now = new Date();
      const application: Application = {
        ...data,
        id: randomUUID(),
        userId,
        createdAt: now,
        updatedAt: now,
      };
      applications.push(application);
      return application;
    },

    async updateApplication(userId, id, changes) {
      const application = find(userId, id);
      if (!application) {
        return null;
      }
      // Like Prisma, a key set to undefined means "leave it alone".
      for (const [key, value] of Object.entries(changes)) {
        if (value !== undefined) {
          Object.assign(application, { [key]: value });
        }
      }
      application.updatedAt = new Date();
      return application;
    },

    async deleteApplication(userId, id) {
      const before = applications.length;
      applications = applications.filter((a) => !(a.id === id && a.userId === userId));
      return applications.length < before;
    },
  };
}
