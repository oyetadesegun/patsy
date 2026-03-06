import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString = process.env.DATABASE_URL;

const poolConfig = {
  connectionString,
  max: 5, // Lower max connections for local dev
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool(poolConfig);
}

const adapter = new PrismaPg(globalForPrisma.pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
