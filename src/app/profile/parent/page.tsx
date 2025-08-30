import { auth } from '../../../../auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { ParentProfileClient } from './parent-profile-client';

const prisma = new PrismaClient();

export default async function ParentProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'PARENT') {
    redirect('/auth/forbidden');
  }

  const parent = await prisma.parent.findUnique({
    where: { id: session.user.id },
    include: {
      students: {
        select: { id: true, name: true, interests: true }
      }
    }
  });

  if (!parent) {
    redirect('/auth/forbidden');
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