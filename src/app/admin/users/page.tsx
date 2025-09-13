import { auth } from '../../../../auth';
import { redirect } from 'next/navigation';
import { AdminUsersClient } from './admin-users-client';
import { getUserRole } from '@/lib/user-role';

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = await getUserRole(session.user.email!);
  if (userRole !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ユーザー管理</h1>
        <AdminUsersClient />
      </div>
    </div>
  );
}