import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/auth';

const prisma = new PrismaClient();

const setupRoleSchema = z.object({
  email: z.string().email(),
  role: z.enum(['STUDENT', 'PARENT', 'TUTOR']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role } = setupRoleSchema.parse(body);

    // セッションのメールアドレスと一致するかチェック
    if (email !== session.user.email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
    }

    // 既存のロール設定があるかチェック
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Role already set' }, { status: 409 });
    }

    // ロールに応じてユーザーを作成
    let result;
    const userData = {
      googleEmail: email,
      name: session.user.name || 'Unknown User',
    };

    switch (role) {
      case 'STUDENT':
        // Studentの場合は、Parentレコードも必要なので一時的な対応
        // 実際の運用では、Parentが先に登録されている必要がある
        result = await prisma.student.create({
          data: {
            ...userData,
            parent: {
              create: {
                email: email, // 一時的に同じメールアドレスを使用
                name: session.user.name || 'Unknown Parent',
              },
            },
          },
        });
        break;

      case 'PARENT':
        result = await prisma.parent.create({
          data: {
            email: email,
            name: session.user.name || 'Unknown Parent',
          },
        });
        break;

      case 'TUTOR':
        result = await prisma.tutor.create({
          data: userData,
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      role,
      entityId: result.id 
    });

  } catch (error) {
    console.error('Setup role error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: error.issues 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// ユーザー存在確認のヘルパー関数
async function findUserByEmail(email: string): Promise<boolean> {
  try {
    const [student, parent, tutor, admin] = await Promise.all([
      prisma.student.findUnique({ where: { googleEmail: email } }),
      prisma.parent.findUnique({ where: { email: email } }),
      prisma.tutor.findUnique({ where: { googleEmail: email } }),
      prisma.admin.findUnique({ where: { googleEmail: email } }),
    ]);

    return !!(student || parent || tutor || admin);
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}