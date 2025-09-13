import { prisma } from "@/lib/prisma";

export type UserRole = 'student' | 'parent' | 'tutor' | 'admin';

export async function getUserRole(email: string): Promise<UserRole | null> {
  try {
    // Student テーブルをチェック
    const student = await prisma.student.findUnique({
      where: { email },
      select: { id: true }
    });
    if (student) return 'student';

    // Parent テーブルをチェック
    const parent = await prisma.parent.findUnique({
      where: { email },
      select: { id: true }
    });
    if (parent) return 'parent';

    // Tutor テーブルをチェック
    const tutor = await prisma.tutor.findUnique({
      where: { email },
      select: { id: true }
    });
    if (tutor) return 'tutor';

    // Admin テーブルをチェック
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true }
    });
    if (admin) return 'admin';

    return null;
  } catch (error) {
    console.error('[getUserRole] Error:', error);
    return null;
  }
}

export function getRoleRedirectPath(role: UserRole): string {
  switch (role) {
    case 'student':
      return '/student';
    case 'parent':
      return '/parent';
    case 'tutor':
      return '/tutor';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}