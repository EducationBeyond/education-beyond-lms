import { auth } from '@/auth';
import { getUserRole } from '@/lib/user-role';
import { redirect } from 'next/navigation';
import { TutorAssignedStudentsClient } from './tutor-assigned-students-client';

export default async function TutorStudentsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const userRole = await getUserRole(session.user.email);
  if (userRole !== 'tutor') {
    redirect('/');
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">担当参加者</h1>
        <p className="text-gray-600 mt-2">現在担当している参加者の情報と学習記録を管理できます</p>
      </div>
      <TutorAssignedStudentsClient />
    </>
  );
}
