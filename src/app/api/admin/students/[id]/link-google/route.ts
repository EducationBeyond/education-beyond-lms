import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// 学生にGoogleメールアドレスを設定するスキーマ
const setGoogleEmailSchema = z.object({
  email: z.string().email('有効なGoogleメールアドレスを入力してください'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const body = await request.json();
    const validatedData = setGoogleEmailSchema.parse(body);

    const { email } = validatedData;

    // 学生の存在確認
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { parent: true },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: '学生が見つかりません' },
        { status: 404 }
      );
    }

    // 既にメールアドレスが設定されている場合はエラー
    if (existingStudent.email) {
      return NextResponse.json(
        { error: 'この学生には既にGoogleメールアドレスが設定されています' },
        { status: 409 }
      );
    }

    // 指定されたメールアドレスが他のユーザーで使用されていないかチェック
    const emailInUse = await checkEmailExists(email);
    if (emailInUse) {
      return NextResponse.json(
        { error: '指定されたメールアドレスは既に使用されています' },
        { status: 409 }
      );
    }

    // トランザクションで学生のメールアドレス設定とUserレコード作成を同時実行
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // 1. Userテーブルにレコードを作成
      const user = await tx.user.create({
        data: {
          email: email,
          name: existingStudent.name,
          emailVerified: new Date(), // Google OAuth用に認証済みにする
        },
      });

      // 2. StudentテーブルにメールアドレスとUserIDを設定
      const student = await tx.student.update({
        where: { id: studentId },
        data: {
          email: email,
          userId: user.id,
          updatedAt: new Date(),
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      return student;
    });

    return NextResponse.json({
      success: true,
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        parent: updatedStudent.parent,
      },
      message: `学生「${updatedStudent.name}」のGoogleメールアドレス「${email}」を設定しました。学生本人がGoogle OAuthでログインできるようになりました。`,
    });

  } catch (error) {
    console.error('Link Google Account error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'バリデーションエラーが発生しました',
          details: error.issues.map(issue => ({
            path: issue.path,
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Googleメールアドレスの設定処理中にエラーが発生しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// メールアドレス重複チェックのヘルパー関数
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const [user, student, parent, tutor, admin] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.student.findUnique({ where: { email } }),
      prisma.parent.findUnique({ where: { email } }),
      prisma.tutor.findUnique({ where: { email } }),
      prisma.admin.findUnique({ where: { email } }),
    ]);

    return !!(user || student || parent || tutor || admin);
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
}