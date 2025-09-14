import { prisma } from "@/lib/prisma";

export type UserRole = 'student' | 'parent' | 'tutor' | 'admin';

export async function getUserRole(email: string): Promise<UserRole | null> {
  try {
    console.log('[getUserRole] Looking up role for email:', email);

    // まずUserレコードを取得
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: { select: { id: true } },
        parent: { select: { id: true } },
        tutor: { select: { id: true } },
        admin: { select: { id: true } }
      }
    });

    if (!user) {
      console.log('[getUserRole] User not found in users table');
      return null;
    }

    console.log('[getUserRole] User found, checking roles:', {
      hasStudent: !!user.student,
      hasParent: !!user.parent,
      hasTutor: !!user.tutor,
      hasAdmin: !!user.admin
    });

    // ユーザーのロールをチェック（優先度順）
    if (user.admin) return 'admin';
    if (user.tutor) return 'tutor';
    if (user.parent) return 'parent';
    if (user.student) return 'student';

    // Userレコードは存在するが、どの役割にも紐づいていない場合
    console.log('[getUserRole] User exists but has no role assignment');
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