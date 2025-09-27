import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { UnassignedUsersClient } from './unassigned-users-client';

export default async function UnassignedUsersPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // 管理者権限チェック
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
  });

  if (!admin) {
    redirect('/');
  }

  // ロールが未割り当てのユーザーを取得
  const unassignedUsers = await prisma.user.findMany({
    where: {
      AND: [
        { email: { not: null } },
        { student: null },
        { parent: null },
        { tutor: null },
        { admin: null },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
      emailVerified: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 保護者一覧も取得（参加者ロール割り当て時に必要）
  const parents = await prisma.parent.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ロール未割り当てユーザー</h1>
          <p className="text-muted-foreground">
            Google OAuthでログインしたがロールが未設定のユーザー一覧です。
          </p>
        </div>

        <UnassignedUsersClient
          unassignedUsers={unassignedUsers}
          parents={parents}
        />
      </div>
    </div>
  );
}
