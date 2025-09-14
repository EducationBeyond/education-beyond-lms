import { auth } from '@/auth';
import { getUserRole } from '@/lib/user-role';
import { redirect } from 'next/navigation';
import { StudentAssignedTutorClient } from './student-assigned-tutor-client';

export default async function StudentAssignedTutorPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const userRole = await getUserRole(session.user.email);
  if (userRole !== 'student') {
    redirect('/');
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">担当チューター</h1>
        <p className="text-gray-600 mt-2">マッチングされたチューターとの研究予約ができます</p>
      </div>
      <StudentAssignedTutorClient />
    </>
  );
}
