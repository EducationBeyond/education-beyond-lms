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

export async function getRoleRedirectPath(role: UserRole, email: string): Promise<string> {
  switch (role) {
    case 'student':
      return '/student';
    case 'parent':
      // 保護者の場合、紐付く最初のStudentページにリダイレクト
      const parent = await prisma.parent.findUnique({
        where: { email },
        include: {
          students: {
            where: { deletedAt: null },
            select: { id: true },
            take: 1,
          }
        }
      });

      if (parent?.students[0]) {
        return '/student';
      }
      // Studentが紐付いていない場合はデフォルトページ
      return '/';
    case 'tutor':
      return '/tutor';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}