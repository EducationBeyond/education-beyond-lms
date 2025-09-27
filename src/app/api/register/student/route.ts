import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const studentRegistrationSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  firstName: z.string().min(1, '名は必須です'),
  lastName: z.string().min(1, '姓は必須です'),
  birthdate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  interests: z.array(z.string()).optional(),
  cautions: z.string().optional(),
  // 保護者情報（オプション、未指定時は参加者と同じ情報でParentを作成）
  parentEmail: z.string().email().optional(),
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API Student Registration] Registration request:', { email: body.email, firstName: body.firstName, lastName: body.lastName });

    // バリデーション
    const validationResult = studentRegistrationSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('[API Student Registration] Validation error:', validationResult.error.issues);
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
      console.log('[API Student Registration] Email already exists:', data.email);
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    // 既存の参加者データ確認
    const existingStudent = await prisma.student.findUnique({
      where: { email: data.email },
    });

    if (existingStudent) {
      console.log('[API Student Registration] Student already exists:', data.email);
      return NextResponse.json(
        { error: '既に参加者として登録されています' },
        { status: 409 }
      );
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(data.password, 12);

    // トランザクションでユーザー、保護者、参加者データを作成
    const result = await prisma.$transaction(async (tx) => {
      // Userテーブルに登録
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: `${data.lastName} ${data.firstName}`,
          passwordHash,
        },
      });

      // 保護者情報を決定（未指定時は参加者と同じ情報を使用）
      const parentEmail = data.parentEmail || data.email;
      const parentFirstName = data.parentFirstName || '未設定';
      const parentLastName = data.parentLastName || data.lastName + 'の保護者';

      // 既存のParentをチェック
      let parent = await tx.parent.findUnique({
        where: { email: parentEmail },
      });

      // Parentが存在しない場合は作成
      if (!parent) {
        parent = await tx.parent.create({
          data: {
            email: parentEmail,
            firstName: parentFirstName,
            lastName: parentLastName,
            firstNameKana: '',
            lastNameKana: '',
            nameAlphabet: '',
            phoneNumber: '',
            postalCode: '',
            prefecture: '',
            city: '',
            addressDetail: '',
            userId: `parent-${Date.now()}`,
          },
        });
        console.log('[API Student Registration] Created parent:', { parentId: parent.id, email: parentEmail });
      } else {
        console.log('[API Student Registration] Using existing parent:', { parentId: parent.id, email: parentEmail });
      }

      // Studentテーブルに登録
      const student = await tx.student.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          firstNameKana: '',
          lastNameKana: '',
          nameAlphabet: '',
          birthdate: data.birthdate ? new Date(data.birthdate) : new Date('2000-01-01'),
          gender: data.gender || 'OTHER',
          giftedEpisodes: '',
          interests: data.interests || [],
          schoolName: '',
          cautions: data.cautions || '',
          howDidYouKnow: '',
          parentId: parent.id, // 必須のparentIdを設定
        },
      });

      return { user, parent, student };
    });

    console.log('[API Student Registration] Registration successful:', {
      userId: result.user.id,
      parentId: result.parent.id,
      studentId: result.student.id
    });

    return NextResponse.json({
      message: '参加者アカウントが正常に作成されました',
      userId: result.user.id,
      parentId: result.parent.id,
      studentId: result.student.id,
    }, { status: 201 });

  } catch (error) {
    console.error('[API Student Registration] Error:', error);
    return NextResponse.json(
      { error: 'アカウント作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
