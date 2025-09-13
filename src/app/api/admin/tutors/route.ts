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

    const tutors = await prisma.tutor.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        furigana: true,
        affiliation: true,
        specialties: true,
        avatarUrl: true,
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

    return NextResponse.json({ tutors });
  } catch (error) {
    console.error('[Admin Tutors] Error fetching tutors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tutors' },
      { status: 500 }
    );
  }
}