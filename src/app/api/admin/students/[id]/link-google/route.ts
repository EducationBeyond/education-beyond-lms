import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 学生にGoogleアカウントを紐づけるスキーマ
const linkGoogleAccountSchema = z.object({
  email: z.string().email('有効なGoogleメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await request.json();
    const validatedData = linkGoogleAccountSchema.parse(body);

    const { email, password } = validatedData;

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
        { error: 'この学生には既にGoogleアカウントが紐づけられています' },
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

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // トランザクションで学生情報を更新
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // 1. 学生のメールアドレスとパスワードを設定
      const student = await tx.student.update({
        where: { id: studentId },
        data: {
          email: email,
          password: hashedPassword,
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

      // 2. 必要に応じて User テーブルにも作成（NextAuth用）
      // 現在はLegacy認証方式なので、将来的に移行する際に使用

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
      message: `学生「${updatedStudent.name}」にGoogleアカウント「${email}」を紐づけました`,
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
      { error: 'Googleアカウントの紐づけ処理中にエラーが発生しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// メールアドレス重複チェックのヘルパー関数
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const [student, parent, tutor, admin] = await Promise.all([
      prisma.student.findUnique({ where: { email } }),
      prisma.parent.findUnique({ where: { email } }),
      prisma.tutor.findUnique({ where: { email } }),
      prisma.admin.findUnique({ where: { email } }),
    ]);

    return !!(student || parent || tutor || admin);
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
}