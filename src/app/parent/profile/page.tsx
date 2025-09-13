import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { ParentProfileClient } from './parent-profile-client';
import { getUserRole } from '@/lib/user-role';

const prisma = new PrismaClient();

export default async function ParentProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = await getUserRole(session.user.email!);
  if (userRole !== 'parent') {
    redirect('/login');
  }

  const parent = await prisma.parent.findUnique({
    where: { email: session.user.email! },
    include: {
      students: {
        select: { id: true, name: true, interests: true }
      }
    }
  });

  if (!parent) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">保護者プロフィール</h1>
        <ParentProfileClient initialData={parent} />
      </div>
    </div>
  );
}