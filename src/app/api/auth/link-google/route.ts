import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { getUserRole } from '@/lib/user-role';
import { signIn } from 'next-auth/react';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.email);
    const body = await request.json();
    const { googleEmail } = body;

    if (!googleEmail) {
      return NextResponse.json({ error: 'Google email is required' }, { status: 400 });
    }

    console.log('[Link Google] Linking Google account:', {
      currentEmail: session.user.email,
      googleEmail,
      userRole
    });

    // 既に別のユーザーが同じGoogleアカウントを使っているかチェック
    let existingUser = null;
    
    switch (userRole) {
      case 'student':
        existingUser = await prisma.student.findFirst({
          where: {
            email: googleEmail,
            NOT: { email: session.user.email },
            deletedAt: null
          }
        });
        break;
      case 'tutor':
        existingUser = await prisma.tutor.findFirst({
          where: {
            email: googleEmail,
            NOT: { email: session.user.email },
            deletedAt: null
          }
        });
        break;
      case 'admin':
        existingUser = await prisma.admin.findFirst({
          where: {
            email: googleEmail,
            NOT: { email: session.user.email },
            deletedAt: null
          }
        });
        break;
      case 'parent':
        existingUser = await prisma.parent.findFirst({
          where: {
            email: googleEmail,
            NOT: { email: session.user.email },
            deletedAt: null
          }
        });
        break;
    }

    if (existingUser) {
      return NextResponse.json({ 
        error: 'このGoogleアカウントは既に別のユーザーによって使用されています' 
      }, { status: 400 });
    }

    // 現在のユーザーのメールアドレスをGoogleアカウントに更新
    let updatedUser = null;
    
    switch (userRole) {
      case 'student':
        updatedUser = await prisma.student.update({
          where: { email: session.user.email },
          data: { email: googleEmail }
        });
        break;
      case 'tutor':
        updatedUser = await prisma.tutor.update({
          where: { email: session.user.email },
          data: { email: googleEmail }
        });
        break;
      case 'admin':
        updatedUser = await prisma.admin.update({
          where: { email: session.user.email },
          data: { email: googleEmail }
        });
        break;
      case 'parent':
        updatedUser = await prisma.parent.update({
          where: { email: session.user.email },
          data: { email: googleEmail }
        });
        break;
    }

    // Userテーブルも更新（Auth.jsのセッション用）
    const authUser = await prisma.user.upsert({
      where: { email: googleEmail },
      update: {
        name: session.user.name,
        image: session.user.image,
      },
      create: {
        email: googleEmail,
        name: session.user.name,
        image: session.user.image,
      }
    });

    // 古いUserレコードを削除
    if (session.user.email !== googleEmail) {
      await prisma.user.deleteMany({
        where: { email: session.user.email }
      });
    }

    console.log('[Link Google] Google account linked successfully:', {
      oldEmail: session.user.email,
      newEmail: googleEmail,
      userRole
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Googleアカウントが連携されました',
      user: updatedUser 
    });
  } catch (error) {
    console.error('[Link Google] Error linking Google account:', error);
    return NextResponse.json(
      { error: 'Googleアカウント連携に失敗しました' },
      { status: 500 }
    );
  }
}