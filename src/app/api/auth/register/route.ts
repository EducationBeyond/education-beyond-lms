import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { UserRole } from '@/lib/user-role';

// 登録用スキーマ
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['STUDENT', 'PARENT', 'TUTOR']), // ADMINは除外（管理者が作成）
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    
    const { email, password, firstName, lastName, role } = validatedData;

    // 既存ユーザーチェック
    const existingUser = await checkUserExists(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // ユーザー作成
    let createdUser;
    switch (role) {
      case 'STUDENT':
        // Studentの場合、一時的なParentレコードも作成
        // 実際の運用では親が先に登録するか、別途親子関係を設定する
        // 一時的なユーザーIDを生成（親用）
        const tempUserId = `temp-parent-${Date.now()}`;

        const tempParent = await prisma.parent.create({
          data: {
            email: `temp.parent.${Date.now()}@temp.example.com`,
            firstName: '未設定',
            lastName: `${lastName}の保護者`,
            firstNameKana: 'ミセッテイ',
            lastNameKana: 'ホゴシャ',
            nameAlphabet: 'Guardian',
            phoneNumber: '',
            postalCode: '',
            prefecture: '',
            city: '',
            addressDetail: '',
            userId: tempUserId,
          },
        });

        createdUser = await prisma.student.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            lastNameKana: '',
            firstNameKana: '',
            nameAlphabet: '',
            parentId: tempParent.id,
            birthdate: new Date('2000-01-01'), // デフォルト日付
            gender: 'OTHER', // デフォルト値
            giftedEpisodes: '',
            interests: [],
            schoolName: '',
            cautions: '',
            howDidYouKnow: '',
          },
        });
        break;

      case 'PARENT':
        createdUser = await prisma.parent.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            lastNameKana: '',
            firstNameKana: '',
            nameAlphabet: '',
            phoneNumber: '',
            postalCode: '',
            prefecture: '',
            city: '',
            addressDetail: '',
            userId: `parent-${Date.now()}`,
          },
        });
        break;

      case 'TUTOR':
        createdUser = await prisma.tutor.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            lastNameKana: '',
            firstNameKana: '',
            nameAlphabet: '',
            phoneNumber: '',
            postalCode: '',
            prefecture: '',
            city: '',
            addressDetail: '',
            nearestStation: '',
            affiliation: '',
            education: '',
            specialties: [],
            selfIntroduction: '',
            bankName: '',
            bankCode: '',
            branchName: '',
            branchCode: '',
            accountType: '',
            accountNumber: '',
            userId: `tutor-${Date.now()}`,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ユーザー存在チェックのヘルパー関数
async function checkUserExists(email: string): Promise<boolean> {
  try {
    const [student, parent, tutor, admin] = await Promise.all([
      prisma.student.findUnique({ where: { email } }),
      prisma.parent.findUnique({ where: { email } }),
      prisma.tutor.findUnique({ where: { email } }),
      prisma.admin.findUnique({ where: { email } }),
    ]);

    return !!(student || parent || tutor || admin);
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}