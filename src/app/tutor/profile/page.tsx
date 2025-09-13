import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { TutorProfileClient } from './tutor-profile-client';
import { getUserRole } from '@/lib/user-role';

const prisma = new PrismaClient();

export default async function TutorProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = await getUserRole(session.user.email!);
  if (userRole !== 'tutor') {
    redirect('/login');
  }

  const tutor = await prisma.tutor.findUnique({
    where: { email: session.user.email! },
    include: {
      pairings: {
        where: { status: 'ACTIVE' },
        include: {
          student: { select: { id: true, name: true } }
        }
      },
      availabilities: {
        orderBy: { startAt: 'asc' }
      }
    }
  });

  if (!tutor) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">チュータープロフィール</h1>
        <TutorProfileClient initialData={tutor} />
      </div>
    </div>
  );
}