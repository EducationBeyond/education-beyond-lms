import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import { PrismaClient } from '@prisma/client';
import type { NextAuthConfig } from 'next-auth';

const prisma = new PrismaClient();

// ユーザーロールの型定義
export type UserRole = 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN';

// セッション拡張の型定義
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      entityId?: string; // Student/Parent/Tutor/Adminテーブルの実際のID
    };
  }

  interface User {
    id: string;
    role?: UserRole;
    entityId?: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: UserRole;
    entityId?: string;
  }
}

export const config = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        // 既存ユーザーのロール確認
        const existingUser = await findUserByEmail(user.email);
        
        if (existingUser) {
          return true; // 既存ユーザーはサインイン許可
        }

        // 新規ユーザーの場合、まずはサインインを許可し、後でロール設定を促す
        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const userData = await findUserByEmail(user.email);
        if (userData) {
          token.role = userData.role as UserRole;
          token.entityId = userData.entityId as string;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session?.user?.email) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole | undefined;
        session.user.entityId = token.entityId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 1 * 60 * 60, // 1時間（セキュリティ要件）
  },
  jwt: {
    maxAge: 1 * 60 * 60, // 1時間
  },
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;

// ユーザー情報を取得するヘルパー関数
async function findUserByEmail(email: string): Promise<{
  role: UserRole;
  entityId: string;
} | null> {
  try {
    // Students テーブルから検索
    const student = await prisma.student.findUnique({
      where: { googleEmail: email },
      select: { id: true },
    });
    if (student) {
      return { role: 'STUDENT', entityId: student.id };
    }

    // Parents テーブルから検索（Students経由）
    const parent = await prisma.parent.findUnique({
      where: { email: email },
      select: { id: true },
    });
    if (parent) {
      return { role: 'PARENT', entityId: parent.id };
    }

    // Tutors テーブルから検索
    const tutor = await prisma.tutor.findUnique({
      where: { googleEmail: email },
      select: { id: true },
    });
    if (tutor) {
      return { role: 'TUTOR', entityId: tutor.id };
    }

    // Admins テーブルから検索
    const admin = await prisma.admin.findUnique({
      where: { googleEmail: email },
      select: { id: true, role: true },
    });
    if (admin) {
      return { role: 'ADMIN', entityId: admin.id };
    }

    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(config);