import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { notifyStudentRegistration } from '@/lib/slack';

// 保護者と参加者の統合登録用スキーマ
const parentStudentRegistrationSchema = z.object({
  parent: z.object({
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
    firstName: z.string().min(1, '保護者の名は必須です'),
    lastName: z.string().min(1, '保護者の姓は必須です'),
  }),
  student: z.object({
    firstName: z.string().min(1, '参加者の名は必須です'),
    lastName: z.string().min(1, '参加者の姓は必須です'),
    birthdate: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    interests: z.array(z.string()).optional().default([]),
    cautions: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const validatedData = parentStudentRegistrationSchema.parse(body);

    const { parent: parentData, student: studentData } = validatedData;

    // 既存ユーザーチェック（保護者）
    console.log('Checking for existing user with email:', parentData.email);
    const existingParent = await checkUserExists(parentData.email);
    console.log('Existing parent check result:', existingParent);
    if (existingParent) {
      return NextResponse.json(
        { error: '保護者のメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    // パスワードハッシュ化（保護者のみ）
    const hashedParentPassword = await bcrypt.hash(parentData.password, 12);

    // トランザクションで保護者と参加者を作成
    console.log('Starting transaction with data:', { parentData, studentData });
    const result = await prisma.$transaction(async (tx) => {
      console.log('Creating user...');
      // 1. まずUserレコードを作成
      const user = await tx.user.create({
        data: {
          email: parentData.email,
          name: `${parentData.lastName} ${parentData.firstName}`,
          passwordHash: hashedParentPassword,
        },
      });

      console.log('Creating parent...');
      // 2. 保護者を作成
      const createdParent = await tx.parent.create({
        data: {
          email: parentData.email,
          password: hashedParentPassword,
          firstName: parentData.firstName,
          lastName: parentData.lastName,
          firstNameKana: '',
          lastNameKana: '',
          nameAlphabet: '',
          phoneNumber: '',
          postalCode: '',
          prefecture: '',
          city: '',
          addressDetail: '',
          userId: user.id, // 作成したUserのIDを参照
          createdBy: 'system',
          updatedBy: 'system',
        },
      });
      console.log('Parent created with ID:', createdParent.id);

      console.log('Creating student...');
      // 3. 参加者を作成（保護者と自動リンク、メールとパスワードは後から設定）
      const studentCreateData = {
        email: null, // 明示的にnullを設定（運営側で後から設定）
        password: null, // 明示的にnullを設定（運営側で後から設定）
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        firstNameKana: '',
        lastNameKana: '',
        nameAlphabet: '',
        parentId: createdParent.id, // 自動紐づけ
        birthdate: studentData.birthdate ? new Date(studentData.birthdate) : new Date('2000-01-01'),
        gender: studentData.gender || 'OTHER',
        giftedEpisodes: '',
        interests: studentData.interests || [],
        schoolName: '',
        cautions: studentData.cautions || '',
        howDidYouKnow: '',
        createdBy: 'system',
        updatedBy: 'system',
      };
      console.log('Student create data:', studentCreateData);

      const createdStudent = await tx.student.create({
        data: studentCreateData,
      });
      console.log('Student created with ID:', createdStudent.id);

      return { user, parent: createdParent, student: createdStudent };
    });

    // Slack通知を送信
    try {
      await notifyStudentRegistration({
        name: `${result.student.lastName} ${result.student.firstName}`,
        email: result.parent.email, // 保護者のメールアドレスを使用
        parentName: `${result.parent.lastName} ${result.parent.firstName}`,
        interests: result.student.interests,
        grade: '', // 学年情報がない場合は空文字
      });
      console.log('[API Student Registration] Slack notification sent successfully');
    } catch (error) {
      console.error('[API Student Registration] Failed to send Slack notification:', error);
      // Slack通知の失敗は登録成功の妨げにしない
    }

    return NextResponse.json({
      success: true,
      parent: {
        id: result.parent.id,
        email: result.parent.email,
        firstName: result.parent.firstName,
        lastName: result.parent.lastName,
      },
      student: {
        id: result.student.id,
        firstName: result.student.firstName,
        lastName: result.student.lastName,
        parentId: result.student.parentId,
        // email は後から設定されるため含めない
      },
    });

  } catch (error) {
    console.error('Parent-Student registration error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: body
    });

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

    // 開発環境では詳細なエラーを返す
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: '登録処理中にエラーが発生しました。しばらく時間をおいて再度お試しください。',
        ...(isDevelopment && {
          details: error instanceof Error ? error.message : String(error)
        })
      },
      { status: 500 }
    );
  }
}

// ユーザー存在チェックのヘルパー関数
async function checkUserExists(email: string): Promise<boolean> {
  try {
    console.log('Checking email existence for:', email);
    const [student, parent, tutor, admin] = await Promise.all([
      prisma.student.findUnique({ where: { email } }),
      prisma.parent.findUnique({ where: { email } }),
      prisma.tutor.findUnique({ where: { email } }),
      prisma.admin.findUnique({ where: { email } }),
    ]);

    console.log('Database check results:', { student: !!student, parent: !!parent, tutor: !!tutor, admin: !!admin });
    const exists = !!(student || parent || tutor || admin);
    console.log('User exists:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking user existence:', error);
    // エラーの場合は安全サイドに倒してtrueを返す（重複として扱う）
    throw error;
  }
}
