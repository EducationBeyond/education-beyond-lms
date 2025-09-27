import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { notifyTutorRegistration } from '@/lib/slack';

const tutorRegistrationSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  firstName: z.string().min(1, '名は必須です'),
  lastName: z.string().min(1, '姓は必須です'),
  affiliation: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API Tutor Registration] Registration request:', { email: body.email, firstName: body.firstName, lastName: body.lastName });

    // バリデーション
    const validationResult = tutorRegistrationSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('[API Tutor Registration] Validation error:', validationResult.error.issues);
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
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
          name: `${data.lastName} ${data.firstName}`,
          passwordHash,
        },
      });

      // Tutorテーブルに登録
      const tutor = await tx.tutor.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          firstNameKana: '',
          lastNameKana: '',
          nameAlphabet: '',
          phoneNumber: '',
          postalCode: '',
          prefecture: '',
          city: '',
          addressDetail: '',
          nearestStation: '',
          affiliation: data.affiliation || '',
          education: '',
          specialties: data.specialties || [],
          selfIntroduction: '',
          bankName: '',
          bankCode: '',
          branchName: '',
          branchCode: '',
          accountType: '',
          accountNumber: '',
          userId: user.id, // 作成したUserのIDを参照
        },
      });

      return { user, tutor };
    });

    console.log('[API Tutor Registration] Registration successful:', {
      userId: result.user.id,
      tutorId: result.tutor.id
    });

    // Slack通知を送信
    try {
      await notifyTutorRegistration({
        name: `${data.lastName} ${data.firstName}`,
        email: data.email,
        specialties: data.specialties,
        affiliation: data.affiliation
      });
      console.log('[API Tutor Registration] Slack notification sent successfully');
    } catch (error) {
      console.error('[API Tutor Registration] Failed to send Slack notification:', error);
      // Slack通知の失敗は登録成功の妨げにしない
    }

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