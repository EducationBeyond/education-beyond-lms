import { auth } from '../../../../auth';
import { redirect } from 'next/navigation';
import { AdminUsersClient } from './admin-users-client';

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/auth/forbidden');
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