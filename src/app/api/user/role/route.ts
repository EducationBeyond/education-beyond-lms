import { NextRequest, NextResponse } from 'next/server';
import { getUserRole, getRoleRedirectPath } from '@/lib/user-role';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('[API] Role detection for email:', email);
    const role = await getUserRole(email);

    if (!role) {
      console.log('[API] No role found for user:', email);

      // ユーザーが存在するかチェック
      const { prisma } = await import('@/lib/prisma');
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true }
      });

      if (user) {
        // ユーザーは存在するがロールが未割り当ての場合
        return NextResponse.json(
          {
            error: 'User role not assigned',
            userExists: true,
            user: { email: user.email, name: user.name }
          },
          { status: 422 } // Unprocessable Entity
        );
      } else {
        // ユーザー自体が存在しない場合
        return NextResponse.json(
          {
            error: 'User not found',
            userExists: false
          },
          { status: 404 }
        );
      }
    }

    const redirectPath = getRoleRedirectPath(role);

    return NextResponse.json({
      role,
      redirectPath,
    });
  } catch (error) {
    console.error('[API] Role detection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}