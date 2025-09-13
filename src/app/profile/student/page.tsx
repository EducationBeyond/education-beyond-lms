import { auth } from '../../../../auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { StudentProfileClient } from './student-profile-client';

const prisma = new PrismaClient();

export default async function StudentProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'STUDENT') {
    redirect('/auth/forbidden');
  }

  const student = await prisma.student.findUnique({
    where: { id: session.user.id },
    include: {
      parent: {
        select: { id: true, name: true }
      }
    }
  });

  if (!student) {
    redirect('/auth/forbidden');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">学生プロフィール</h1>
        <StudentProfileClient initialData={student} />
      </div>
    </div>
  );
}