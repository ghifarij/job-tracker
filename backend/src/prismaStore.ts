import type { PrismaClient } from "./generated/prisma/client.js";
import type { Store } from "./store.js";

export function createPrismaStore(prisma: PrismaClient): Store {
  return {
    upsertUser({ googleId, email, name }) {
      return prisma.user.upsert({
        where: { googleId },
        create: { googleId, email, name },
        update: { email, name },
      });
    },

    findUser(id) {
      return prisma.user.findUnique({ where: { id } });
    },

    listApplications(userId, status) {
      return prisma.application.findMany({
        // `status: undefined` means "no status filter" to Prisma.
        where: { userId, status },
        orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
      });
    },

    getApplication(userId, id) {
      return prisma.application.findFirst({ where: { id, userId } });
    },

    createApplication(userId, data) {
      return prisma.application.create({ data: { ...data, userId } });
    },

    // update() and delete() can only filter on the id. The *Many versions
    // take `userId` in the same WHERE clause, so someone else's row is simply
    // not matched: one query, and no window between "check owner" and "write".
    async updateApplication(userId, id, changes) {
      const updated = await prisma.application.updateManyAndReturn({
        where: { id, userId },
        data: changes,
      });
      return updated[0] ?? null;
    },

    async deleteApplication(userId, id) {
      const { count } = await prisma.application.deleteMany({ where: { id, userId } });
      return count > 0;
    },
  };
}
