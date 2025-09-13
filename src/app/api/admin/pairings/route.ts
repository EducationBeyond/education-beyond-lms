import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { getUserRole } from '@/lib/user-role';
import { z } from 'zod';

const prisma = new PrismaClient();

const createPairingSchema = z.object({
  studentId: z.string().min(1, '学生IDは必須です'),
  tutorId: z.string().min(1, 'チューターIDは必須です'),
  score: z.number().min(0).max(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.email);
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 既存のペアリング一覧を取得
    const pairings = await prisma.pairing.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        tutor: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ pairings });
  } catch (error) {
    console.error('[Admin Pairings] Error fetching pairings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pairings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.email);
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createPairingSchema.parse(body);

    console.log('[Admin Pairings] Creating pairing:', validatedData);

    // 学生とチューターの存在確認
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      select: { id: true, name: true, email: true }
    });

    const tutor = await prisma.tutor.findUnique({
      where: { id: validatedData.tutorId },
      select: { id: true, name: true, email: true }
    });

    if (!student) {
      return NextResponse.json({ error: '指定された学生が見つかりません' }, { status: 404 });
    }

    if (!tutor) {
      return NextResponse.json({ error: '指定されたチューターが見つかりません' }, { status: 404 });
    }

    // 既存のペアリングがあるかチェック
    const existingPairing = await prisma.pairing.findFirst({
      where: {
        studentId: validatedData.studentId,
        tutorId: validatedData.tutorId,
        deletedAt: null,
        status: {
          in: ['PENDING', 'ACTIVE']
        }
      }
    });

    if (existingPairing) {
      return NextResponse.json({ 
        error: 'この学生とチューターのペアリングは既に存在します' 
      }, { status: 400 });
    }

    // 新しいペアリングを作成
    const pairing = await prisma.pairing.create({
      data: {
        studentId: validatedData.studentId,
        tutorId: validatedData.tutorId,
        status: 'ACTIVE',
        score: validatedData.score || null,
        startedAt: new Date(),
        createdBy: session.user.email,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        tutor: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log('[Admin Pairings] Pairing created successfully:', pairing.id);

    return NextResponse.json({ pairing }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Admin Pairings] Validation error:', error.issues);
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }

    console.error('[Admin Pairings] Error creating pairing:', error);
    return NextResponse.json(
      { error: 'Failed to create pairing' },
      { status: 500 }
    );
  }
}