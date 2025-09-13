import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

const tutorRegistrationSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  name: z.string().min(1, '名前は必須です'),
  furigana: z.string().optional(),
  address: z.string().optional(),
  affiliation: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  bankAccountInfo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API Tutor Registration] Registration request:', { email: body.email, name: body.name });

    // バリデーション
    const validationResult = tutorRegistrationSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('[API Tutor Registration] Validation error:', validationResult.error.errors);
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // メールアドレスの重複確認
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.log('[API Tutor Registration] Email already exists:', data.email);
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    // 既存のチューターデータ確認
    const existingTutor = await prisma.tutor.findUnique({
      where: { email: data.email },
    });

    if (existingTutor) {
      console.log('[API Tutor Registration] Tutor already exists:', data.email);
      return NextResponse.json(
        { error: '既にチューターとして登録されています' },
        { status: 409 }
      );
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(data.password, 12);

    // トランザクションでユーザーとチューターデータを作成
    const result = await prisma.$transaction(async (tx) => {
      // Userテーブルに登録
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
        },
      });

      // Tutorテーブルに登録
      const tutor = await tx.tutor.create({
        data: {
          email: data.email,
          name: data.name,
          furigana: data.furigana || null,
          address: data.address || null,
          affiliation: data.affiliation || null,
          specialties: data.specialties || [],
          bankAccountInfo: data.bankAccountInfo || null,
        },
      });

      return { user, tutor };
    });

    console.log('[API Tutor Registration] Registration successful:', { 
      userId: result.user.id, 
      tutorId: result.tutor.id 
    });

    return NextResponse.json({
      message: 'チューターアカウントが正常に作成されました',
      userId: result.user.id,
      tutorId: result.tutor.id,
    }, { status: 201 });

  } catch (error) {
    console.error('[API Tutor Registration] Error:', error);
    return NextResponse.json(
      { error: 'アカウント作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}