import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { StudentProfileClient } from './student-profile-client';
import { getUserRole } from '@/lib/user-role';

const prisma = new PrismaClient();

export default async function StudentProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = await getUserRole(session.user.email!);
  if (userRole !== 'student') {
    redirect('/login');
  }

  const student = await prisma.student.findUnique({
    where: { email: session.user.email! },
    include: {
      parent: {
        select: { id: true, name: true }
      }
    }
  });

  if (!student) {
    redirect('/login');
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">参加者プロフィール</h1>
      <StudentProfileClient initialData={student} />
    </>
  );
}
