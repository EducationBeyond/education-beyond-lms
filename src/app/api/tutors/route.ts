import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API Tutors] Fetching tutors list');

    // チューター一覧を取得（基本情報のみ）
    const tutors = await prisma.tutor.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        firstNameKana: true,
        lastNameKana: true,
        affiliation: true,
        specialties: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[API Tutors] Found tutors:', tutors.length);

    return NextResponse.json({ tutors });
  } catch (error) {
    console.error('[API Tutors] Error fetching tutors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tutors' },
      { status: 500 }
    );
  }
}