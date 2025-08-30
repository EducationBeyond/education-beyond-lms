import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import type { NextAuthConfig } from 'next-auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

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
    Credentials({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email', 
          placeholder: 'your-email@example.com' 
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        },
      },
      async authorize(credentials) {
        try {
          // バリデーション
          const parsedCredentials = z
            .object({
              email: z.string().email(),
              password: z.string().min(1),
            })
            .safeParse(credentials);

          if (!parsedCredentials.success) {
            return null;
          }

          const { email, password } = parsedCredentials.data;

          // ユーザー検索
          const userData = await findUserByEmail(email);
          
          if (!userData || !userData.hasPassword) {
            return null; // パスワード未設定のユーザーはCredentials認証不可
          }

          // パスワード検証
          const storedPassword = await getStoredPassword(email, userData.role);
          if (!storedPassword) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, storedPassword);
          if (!isValidPassword) {
            return null;
          }

          // ユーザー名を取得
          const userName = await getUserName(email, userData.role);

          return {
            id: userData.entityId,
            email: email,
            name: userName,
            role: userData.role,
            entityId: userData.entityId,
          };
        } catch (error) {
          console.error('Credentials authorization error:', error);
          return null;
        }
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
  hasPassword: boolean;
} | null> {
  try {
    // Students テーブルから検索
    const student = await prisma.student.findUnique({
      where: { email: email },
      select: { id: true, password: true },
    });
    if (student) {
      return { 
        role: 'STUDENT', 
        entityId: student.id,
        hasPassword: !!student.password 
      };
    }

    // Parents テーブルから検索
    const parent = await prisma.parent.findUnique({
      where: { email: email },
      select: { id: true, password: true },
    });
    if (parent) {
      return { 
        role: 'PARENT', 
        entityId: parent.id,
        hasPassword: !!parent.password 
      };
    }

    // Tutors テーブルから検索
    const tutor = await prisma.tutor.findUnique({
      where: { email: email },
      select: { id: true, password: true },
    });
    if (tutor) {
      return { 
        role: 'TUTOR', 
        entityId: tutor.id,
        hasPassword: !!tutor.password 
      };
    }

    // Admins テーブルから検索
    const admin = await prisma.admin.findUnique({
      where: { email: email },
      select: { id: true, role: true, password: true },
    });
    if (admin) {
      return { 
        role: 'ADMIN', 
        entityId: admin.id,
        hasPassword: !!admin.password 
      };
    }

    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

// パスワード取得のヘルパー関数
async function getStoredPassword(email: string, role: UserRole): Promise<string | null> {
  try {
    switch (role) {
      case 'STUDENT':
        const student = await prisma.student.findUnique({
          where: { email },
          select: { password: true },
        });
        return student?.password || null;

      case 'PARENT':
        const parent = await prisma.parent.findUnique({
          where: { email },
          select: { password: true },
        });
        return parent?.password || null;

      case 'TUTOR':
        const tutor = await prisma.tutor.findUnique({
          where: { email },
          select: { password: true },
        });
        return tutor?.password || null;

      case 'ADMIN':
        const admin = await prisma.admin.findUnique({
          where: { email },
          select: { password: true },
        });
        return admin?.password || null;

      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting stored password:', error);
    return null;
  }
}

// ユーザー名取得のヘルパー関数
async function getUserName(email: string, role: UserRole): Promise<string> {
  try {
    switch (role) {
      case 'STUDENT':
        const student = await prisma.student.findUnique({
          where: { email },
          select: { name: true },
        });
        return student?.name || 'Unknown Student';

      case 'PARENT':
        const parent = await prisma.parent.findUnique({
          where: { email },
          select: { name: true },
        });
        return parent?.name || 'Unknown Parent';

      case 'TUTOR':
        const tutor = await prisma.tutor.findUnique({
          where: { email },
          select: { name: true },
        });
        return tutor?.name || 'Unknown Tutor';

      case 'ADMIN':
        const admin = await prisma.admin.findUnique({
          where: { email },
          select: { name: true },
        });
        return admin?.name || 'Unknown Admin';

      default:
        return 'Unknown User';
    }
  } catch (error) {
    console.error('Error getting user name:', error);
    return 'Unknown User';
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(config);