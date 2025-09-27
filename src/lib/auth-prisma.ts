import { PrismaClient } from "@prisma/client";

// NextAuth専用のPrismaクライアント
// サーバーレス環境での接続プール問題を回避するため、
// メインのprismaインスタンスとは分離
const globalForAuthPrisma = globalThis as unknown as { authPrisma?: PrismaClient };

export const authPrisma =
  globalForAuthPrisma.authPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    // サーバーレス環境での接続プール問題を最小化
    transactionOptions: {
      timeout: 5000, // 5秒（短めに設定）
    },
  });

if (process.env.NODE_ENV !== "production") globalForAuthPrisma.authPrisma = authPrisma;