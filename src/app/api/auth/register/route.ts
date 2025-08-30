import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { UserRole } from '@/auth';

const prisma = new PrismaClient();

// 登録用スキーマ
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['STUDENT', 'PARENT', 'TUTOR']), // ADMINは除外（管理者が作成）
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    
    const { email, password, name, role } = validatedData;

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
        const tempParent = await prisma.parent.create({
          data: {
            email: `temp.parent.${Date.now()}@temp.example.com`,
            name: `${name}の保護者（未設定）`,
          },
        });

        createdUser = await prisma.student.create({
          data: {
            email,
            password: hashedPassword,
            name,
            parentId: tempParent.id,
          },
        });
        break;

      case 'PARENT':
        createdUser = await prisma.parent.create({
          data: {
            email,
            password: hashedPassword,
            name,
          },
        });
        break;

      case 'TUTOR':
        createdUser = await prisma.tutor.create({
          data: {
            email,
            password: hashedPassword,
            name,
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
        name: createdUser.name,
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
  } finally {
    await prisma.$disconnect();
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