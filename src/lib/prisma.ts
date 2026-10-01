import { PrismaClient } from "@prisma/client";

// Ensure environment fallback if only standard DATABASE_URL is defined
if (!process.env.POSTGRES_PRISMA_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_PRISMA_URL = process.env.DATABASE_URL;
}
if (
  !process.env.POSTGRES_URL_NON_POOLING &&
  (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)
) {
  process.env.POSTGRES_URL_NON_POOLING =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
