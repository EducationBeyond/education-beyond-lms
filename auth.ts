import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { getUserRole, getRoleRedirectPath } from "@/lib/user-role";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
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
          where: { email: c.email as string },
        });
        if (!user?.passwordHash) return null;
        const ok = await compare(c.password as string, user.passwordHash);
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
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        // ユーザーのロールを取得してトークンに追加
        if (user.email) {
          const role = await getUserRole(user.email);
          token.userRole = role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).userId = token.userId;
        (session as any).userRole = token.userRole;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('[NextAuth] Redirect callback:', { url, baseUrl });

      // 内部URLの場合（callbackUrlが指定されている場合）
      if (url.startsWith('/') && url !== '/login') {
        console.log('[NextAuth] Internal URL redirect:', url);
        return new URL(url, baseUrl).toString();
      }

      if (new URL(url).origin === baseUrl) {
        console.log('[NextAuth] Same origin redirect:', url);
        return url;
      }

      // OAuth経由でのログイン後は post-login ページでロール判定
      console.log('[NextAuth] OAuth login, redirecting to post-login page');
      const postLoginUrl = new URL('/auth/post-login', baseUrl);

      // 元のcallbackUrlがあれば保持
      const originalUrl = new URL(url);
      const callbackUrl = originalUrl.searchParams.get('callbackUrl');
      if (callbackUrl) {
        postLoginUrl.searchParams.set('callbackUrl', callbackUrl);
      }

      return postLoginUrl.toString();
    },
  },
});