import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { getUserRole } from '@/lib/user-role';

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
        firstName: true,
        lastName: true,
        firstNameKana: true,
        lastNameKana: true,
        affiliation: true,
        postalCode: true,
        prefecture: true,
        city: true,
        addressDetail: true,
        specialties: true,
        avatarUrl: true,
        bankName: true,
        bankCode: true,
        branchName: true,
        branchCode: true,
        accountType: true,
        accountNumber: true,
        interviewCalendarUrl: true,
        lessonCalendarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    console.log('[API Tutor Detail] Found tutor:', `${tutor.lastName} ${tutor.firstName}`);

    // 機密情報（銀行口座情報）は除外してレスポンス
    const { bankName, bankCode, branchName, branchCode, accountType, accountNumber, ...tutorData } = tutor;

    // リクエストしたユーザーがstudentの場合、マッチング情報も取得
    let pairing = null;
    const userRole = await getUserRole(session.user.email);
    if (userRole === 'student') {
      const student = await prisma.student.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });

      if (student) {
        pairing = await prisma.pairing.findFirst({
          where: {
            studentId: student.id,
            tutorId: tutorId,
            deletedAt: null,
          },
          select: {
            id: true,
            status: true,
            score: true,
            startedAt: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }
    }

    return NextResponse.json({ tutor: tutorData, pairing });
  } catch (error) {
    console.error('[API Tutor Detail] Error fetching tutor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tutor details' },
      { status: 500 }
    );
  }
}