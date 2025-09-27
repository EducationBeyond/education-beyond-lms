import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { getUserRole } from '@/lib/user-role';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.email);
    let displayName = session.user.name || '名前未設定';

    // ロールに応じて適切な名前を取得
    switch (userRole) {
      case 'student':
        const student = await prisma.student.findUnique({
          where: { email: session.user.email },
          select: { firstName: true, lastName: true }
        });
        if (student) {
          displayName = `${student.lastName} ${student.firstName}`;
        }
        break;

      case 'parent':
        const parent = await prisma.parent.findUnique({
          where: { email: session.user.email },
          select: { firstName: true, lastName: true }
        });
        if (parent) {
          displayName = `${parent.lastName} ${parent.firstName}`;
        }
        break;

      case 'tutor':
        const tutor = await prisma.tutor.findUnique({
          where: { email: session.user.email },
          select: { firstName: true, lastName: true }
        });
        if (tutor) {
          displayName = `${tutor.lastName} ${tutor.firstName}`;
        }
        break;

      case 'admin':
        const admin = await prisma.admin.findUnique({
          where: { email: session.user.email },
          select: { name: true }
        });
        if (admin) {
          displayName = admin.name;
        }
        break;
    }

    return NextResponse.json({ displayName, role: userRole });
  } catch (error) {
    console.error('[User Display Name] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch display name' },
      { status: 500 }
    );
  }
}