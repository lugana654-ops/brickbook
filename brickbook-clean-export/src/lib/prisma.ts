let prisma: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require("@prisma/client");
  const globalForPrisma = global as unknown as { prisma: any };
  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: ["query"],
    });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
} catch (e) {
  prisma = null;
}

export { prisma };
