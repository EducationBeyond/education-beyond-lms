import { auth } from '../../../../auth';
import { redirect } from 'next/navigation';
import { AdminUsersClient } from './admin-users-client';
import { getUserRole } from '@/lib/user-role';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = await getUserRole(session.user.email!);
  if (userRole !== 'admin') {
    redirect('/login');
  }

  // ロール未割り当てユーザー数を取得
  const unassignedCount = await prisma.user.count({
    where: {
      AND: [
        { email: { not: null } },
        { student: null },
        { parent: null },
        { tutor: null },
        { admin: null },
      ],
    },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">ユーザー管理</h1>
          <div className="flex space-x-2">
            {unassignedCount > 0 && (
              <Button asChild variant="outline">
                <Link href="/admin/users/unassigned">
                  ロール未割り当て ({unassignedCount})
                </Link>
              </Button>
            )}
          </div>
        </div>
        <AdminUsersClient />
      </div>
    </div>
  );
}