import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { getUserRole } from '@/lib/user-role';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.email);
    if (userRole !== 'tutor') {
      return NextResponse.json({ error: 'Tutor access required' }, { status: 403 });
    }

    // チューターの情報を取得
    const tutor = await prisma.tutor.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true }
    });

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    console.log('[Tutor Assigned Students] Fetching assigned students for tutor:', tutor.id);

    // チューターの担当学生（アクティブなペアリング）を取得
    const pairings = await prisma.pairing.findMany({
      where: {
        tutorId: tutor.id,
        deletedAt: null,
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            name: true,
            furigana: true,
            birthdate: true,
            gender: true,
            interests: true,
            cautions: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE を優先
        { startedAt: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log('[Tutor Assigned Students] Found', pairings.length, 'assigned students');

    return NextResponse.json({
      pairings: pairings.map(pairing => ({
        id: pairing.id,
        status: pairing.status,
        score: pairing.score,
        startedAt: pairing.startedAt,
        createdAt: pairing.createdAt,
        student: pairing.student
      }))
    });
  } catch (error) {
    console.error('[Tutor Assigned Students] Error fetching assigned students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned students' },
      { status: 500 }
    );
  }
}