import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let users: any[] = [];

    if (!role || role === 'all') {
      const [students, parents, tutors, admins] = await Promise.all([
        prisma.student.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            parent: { select: { name: true } }
          }
        }),
        prisma.parent.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            students: { select: { name: true } }
          }
        }),
        prisma.tutor.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            affiliation: true
          }
        }),
        prisma.admin.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        })
      ]);

      users = [
        ...students.map(s => ({ ...s, role: 'STUDENT' })),
        ...parents.map(p => ({ ...p, role: 'PARENT' })),
        ...tutors.map(t => ({ ...t, role: 'TUTOR' })),
        ...admins.map(a => ({ ...a, role: 'ADMIN' }))
      ];
    } else {
      switch (role) {
        case 'STUDENT':
          const students = await prisma.student.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              parent: { select: { name: true } }
            }
          });
          users = students.map(s => ({ ...s, role: 'STUDENT' }));
          break;
        case 'PARENT':
          const parents = await prisma.parent.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              students: { select: { name: true } }
            }
          });
          users = parents.map(p => ({ ...p, role: 'PARENT' }));
          break;
        case 'TUTOR':
          const tutors = await prisma.tutor.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              affiliation: true
            }
          });
          users = tutors.map(t => ({ ...t, role: 'TUTOR' }));
          break;
        case 'ADMIN':
          const admins = await prisma.admin.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          });
          users = admins.map(a => ({ ...a, role: 'ADMIN' }));
          break;
      }
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}