import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // チューターの確認
    const tutor = await prisma.tutor.findUnique({
      where: { email: session.user.email },
    });

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    // 担当している生徒一覧を取得
    const pairings = await prisma.pairing.findMany({
      where: {
        tutorId: tutor.id,
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameKana: true,
            lastNameKana: true,
            schoolName: true,
          },
        },
      },
      orderBy: {
        student: {
          firstName: 'asc',
        },
      },
    });

    const students = pairings.map(pairing => pairing.student);

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Tutor students fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}