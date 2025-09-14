import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // 管理者認証チェック
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 管理者権限チェック
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, role, roleData } = await request.json();

    if (!userId || !role || !roleData) {
      return NextResponse.json(
        { error: 'userId, role, and roleData are required' },
        { status: 400 }
      );
    }

    // ユーザーが存在するかチェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: { select: { id: true } },
        parent: { select: { id: true } },
        tutor: { select: { id: true } },
        admin: { select: { id: true } }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 既にロールが割り当てられているかチェック
    if (user.student || user.parent || user.tutor || user.admin) {
      return NextResponse.json(
        { error: 'User already has a role assigned' },
        { status: 409 }
      );
    }

    console.log('[API] Assigning role:', { userId, role, roleData });

    // ロールに応じてレコードを作成
    let result;
    const commonFields = {
      createdBy: admin.id,
      updatedBy: admin.id,
    };

    switch (role) {
      case 'student':
        // 保護者の存在チェック
        if (roleData.parentId) {
          const parent = await prisma.parent.findUnique({
            where: { id: roleData.parentId },
          });
          if (!parent) {
            return NextResponse.json(
              { error: 'Parent not found' },
              { status: 404 }
            );
          }
        }

        result = await prisma.student.create({
          data: {
            email: user.email,
            name: roleData.name || user.name || '',
            furigana: roleData.furigana || '',
            parentId: roleData.parentId,
            userId: userId,
            address: roleData.address || '',
            birthdate: roleData.birthdate ? new Date(roleData.birthdate) : null,
            gender: roleData.gender || null,
            giftedTraits: roleData.giftedTraits || [],
            interests: roleData.interests || [],
            cautions: roleData.cautions || '',
            ...commonFields,
          },
        });
        break;

      case 'parent':
        result = await prisma.parent.create({
          data: {
            email: user.email!,
            name: roleData.name || user.name || '',
            address: roleData.address || '',
            userId: userId,
            ...commonFields,
          },
        });
        break;

      case 'tutor':
        result = await prisma.tutor.create({
          data: {
            email: user.email!,
            name: roleData.name || user.name || '',
            furigana: roleData.furigana || '',
            address: roleData.address || '',
            affiliation: roleData.affiliation || '',
            specialties: roleData.specialties || [],
            userId: userId,
            ...commonFields,
          },
        });
        break;

      case 'admin':
        result = await prisma.admin.create({
          data: {
            email: user.email!,
            name: roleData.name || user.name || '',
            role: roleData.adminRole || 'ADMIN',
            userId: userId,
            ...commonFields,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
    }

    console.log('[API] Role assigned successfully:', { userId, role, resultId: result.id });

    return NextResponse.json({
      success: true,
      message: `Role ${role} assigned successfully`,
      data: { userId, role, id: result.id }
    });

  } catch (error) {
    console.error('[API] Role assignment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}