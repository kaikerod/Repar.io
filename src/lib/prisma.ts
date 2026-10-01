import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.NODE_ENV === "production" ? "file:/tmp/dev.db" : "file:./dev.db";
}

let initialized = false;
async function ensureDbInitialized(client: PrismaClient) {
  if (initialized) return;
  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl.startsWith("file:")) {
    try {
      await client.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "WorkOrder" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "osNumber" TEXT,
          "customerName" TEXT NOT NULL,
          "device" TEXT NOT NULL,
          "issue" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'AGENDADO',
          "scheduledDate" DATETIME,
          "estimatedDuration" INTEGER,
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      initialized = true;
    } catch (e) {
      console.error("Failed to auto-init SQLite schema:", e);
    }
  } else {
    initialized = true;
  }
}

const globalForPrisma = globalThis as unknown as {
  prismaBase: PrismaClient;
  prisma: any;
};

const basePrisma =
  globalForPrisma.prismaBase ||
  new PrismaClient();

export const prisma =
  globalForPrisma.prisma ||
  basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          await ensureDbInitialized(basePrisma);
          return query(args);
        },
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBase = basePrisma;
  globalForPrisma.prisma = prisma;
}
