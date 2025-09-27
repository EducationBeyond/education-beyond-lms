import { auth } from '@/auth';
import { getUserRole } from '@/lib/user-role';
import { redirect } from 'next/navigation';
import { AdminMatchingClient } from './admin-matching-client';

export default async function AdminMatchingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const userRole = await getUserRole(session.user.email);
  if (userRole !== 'admin') {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">マッチング管理</h1>
        <p className="text-gray-600 mt-2">参加者とチューターのマッチングを管理します</p>
      </div>
      <AdminMatchingClient />
    </div>
  );
}
