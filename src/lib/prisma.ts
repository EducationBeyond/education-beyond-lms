import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Vercel/サーバーレス環境での接続プール問題を解決
    transactionOptions: {
      timeout: 10000, // 10秒
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;