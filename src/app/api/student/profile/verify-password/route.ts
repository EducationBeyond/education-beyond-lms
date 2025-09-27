import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getUserRole } from '@/lib/user-role';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.email);
    if (userRole !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // 学生情報を取得して保護者の電話番号を確認
    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      include: {
        parent: {
          select: { phoneNumber: true }
        }
      }
    });

    if (!student?.parent?.phoneNumber) {
      return NextResponse.json({ error: 'Parent phone number not found' }, { status: 404 });
    }

    // 電話番号の下4桁を取得
    const phoneNumber = student.parent.phoneNumber;
    const lastFourDigits = phoneNumber.slice(-4);

    // パスワード検証
    if (password === lastFourDigits) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    console.error('[Student Profile Password] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    );
  }
}