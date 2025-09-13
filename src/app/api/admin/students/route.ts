import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { getUserRole } from '@/lib/user-role';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.email);
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        furigana: true,
        interests: true,
        parent: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            pairings: {
              where: {
                status: 'ACTIVE',
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('[Admin Students] Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}