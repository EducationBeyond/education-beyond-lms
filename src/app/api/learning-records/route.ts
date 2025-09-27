import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createLearningRecordSchema = z.object({
  studentId: z.string(),
  date: z.string().transform((str) => new Date(str)),
  summary: z.string().min(1, '授業内容は必須です'),
  durationMin: z.number().min(1, '授業時間は1分以上で入力してください'),
  goodPoints: z.string().optional(),
  improvementPoints: z.string().optional(),
  homework: z.string().optional(),
  studentLate: z.boolean().default(false),
  tutorLate: z.boolean().default(false),
  additionalNotes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // チューターの確認
    const tutor = await prisma.tutor.findUnique({
      where: { email: session.user.email },
    });

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    // 学習記録の取得
    const records = await prisma.learningRecord.findMany({
      where: { tutorId: tutor.id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameKana: true,
            lastNameKana: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.learningRecord.count({
      where: { tutorId: tutor.id },
    });

    return NextResponse.json({ records, total });
  } catch (error) {
    console.error('Learning records fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = createLearningRecordSchema.parse(body);

    // 生徒とチューターのペアリング確認
    const pairing = await prisma.pairing.findFirst({
      where: {
        studentId: validatedData.studentId,
        tutorId: tutor.id,
        status: 'ACTIVE',
      },
    });

    if (!pairing) {
      return NextResponse.json(
        { error: 'No active pairing found with this student' },
        { status: 403 }
      );
    }

    // 学習記録の作成
    const learningRecord = await prisma.learningRecord.create({
      data: {
        ...validatedData,
        tutorId: tutor.id,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameKana: true,
            lastNameKana: true,
          },
        },
      },
    });

    return NextResponse.json(learningRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Learning record creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}