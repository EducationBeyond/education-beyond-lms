import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { getUserRole, getRoleRedirectPath } from "@/lib/user-role";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" }, // or "jwt"
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // 自動リンクは危険。必要なら signIn コールバックで厳格判定して手動リンク運用を基本に。
      // allowDangerousEmailAccountLinking: false,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(c) {
        if (!c?.email || !c?.password) return null;
        // 認証は users テーブルの password_hash を参照
        const user = await prisma.user.findUnique({
          where: { email: c.email },
        });
        if (!user?.passwordHash) return null;
        const ok = await compare(c.password, user.passwordHash);
        return ok ? { id: user.id, email: user.email!, name: user.name ?? undefined } : null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ account, profile }) {
      // 例: Google の email_verified 相当を確認していない場合は拒否…などを実装
      return true;
    },
    async session({ session, user }) {
      if (user) {
        (session as any).userId = user.id;
        // ユーザーのロールを取得してセッションに追加
        if (user.email) {
          const role = await getUserRole(user.email);
          (session as any).userRole = role;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // デフォルトのリダイレクト処理
      if (url.startsWith('/')) return new URL(url, baseUrl).toString();
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
});