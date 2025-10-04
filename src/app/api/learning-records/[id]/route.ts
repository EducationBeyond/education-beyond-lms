import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateLearningRecordSchema = z.object({
  date: z.string().transform((str) => new Date(str)).optional(),
  summary: z.string().min(1, '授業内容は必須です').optional(),
  durationMin: z.number().min(1, '授業時間は1分以上で入力してください').optional(),
  goodPoints: z.string().optional(),
  improvementPoints: z.string().optional(),
  homework: z.string().optional(),
  studentLate: z.boolean().optional(),
  tutorLate: z.boolean().optional(),
  additionalNotes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // 学習記録の取得（自分が作成したもののみ）
    const record = await prisma.learningRecord.findFirst({
      where: {
        id,
        tutorId: tutor.id
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            firstNameKana: true,
            lastNameKana: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Learning record not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Learning record fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateLearningRecordSchema.parse(body);

    // 学習記録の存在確認（自分が作成したもののみ）
    const existingRecord = await prisma.learningRecord.findFirst({
      where: {
        id,
        tutorId: tutor.id
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Learning record not found' }, { status: 404 });
    }

    // 学習記録の更新
    const updatedRecord = await prisma.learningRecord.update({
      where: { id },
      data: validatedData,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            firstNameKana: true,
            lastNameKana: true,
          },
        },
      },
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Learning record update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // 学習記録の存在確認（自分が作成したもののみ）
    const existingRecord = await prisma.learningRecord.findFirst({
      where: {
        id,
        tutorId: tutor.id
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Learning record not found' }, { status: 404 });
    }

    // 学習記録の削除
    await prisma.learningRecord.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Learning record deleted successfully' });
  } catch (error) {
    console.error('Learning record deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}