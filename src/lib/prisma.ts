import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    connectionString
      ? {
          adapter: new PrismaPg({ connectionString }),
          log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        }
      : {
          adapter: new PrismaPg({
            connectionString: "postgresql://missing:missing@localhost:5432/missing",
          }),
          log: ["error"],
        },
  );

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
