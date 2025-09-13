import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tutorId } = await params;
    console.log('[API Tutor Detail] Fetching tutor:', tutorId);

    // チューターの詳細情報を取得
    const tutor = await prisma.tutor.findUnique({
      where: {
        id: tutorId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        furigana: true,
        affiliation: true,
        address: true,
        specialties: true,
        avatarUrl: true,
        bankAccountInfo: true,
        interviewCalendarUrl: true,
        lessonCalendarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    console.log('[API Tutor Detail] Found tutor:', tutor.name);

    // 機密情報（銀行口座情報）は除外してレスポンス
    const { bankAccountInfo, ...tutorData } = tutor;

    return NextResponse.json({ tutor: tutorData });
  } catch (error) {
    console.error('[API Tutor Detail] Error fetching tutor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tutor details' },
      { status: 500 }
    );
  }
}