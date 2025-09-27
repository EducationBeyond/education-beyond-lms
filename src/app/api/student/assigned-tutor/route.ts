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
    if (userRole !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 });
    }

    // 参加者の情報を取得
    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    console.log('[Student Assigned Tutor] Fetching assigned tutor for student:', student.id);

    // 参加者の担当チューター（アクティブなペアリング）を取得
    const activePairing = await prisma.pairing.findFirst({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        tutor: {
          select: {
            id: true,
            email: true,
            name: true,
            furigana: true,
            affiliation: true,
            address: true,
            specialties: true,
            avatarUrl: true,
            lessonCalendarUrl: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    if (!activePairing) {
      return NextResponse.json({
        message: 'No assigned tutor found',
        pairing: null,
        tutor: null
      });
    }

    console.log('[Student Assigned Tutor] Found assigned tutor:', activePairing.tutor.name);

    return NextResponse.json({
      pairing: {
        id: activePairing.id,
        status: activePairing.status,
        score: activePairing.score,
        startedAt: activePairing.startedAt,
        createdAt: activePairing.createdAt,
      },
      tutor: activePairing.tutor
    });
  } catch (error) {
    console.error('[Student Assigned Tutor] Error fetching assigned tutor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned tutor' },
      { status: 500 }
    );
  }
}
