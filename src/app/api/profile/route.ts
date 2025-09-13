import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const studentProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  birthdate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  interests: z.array(z.string()).optional(),
  cautions: z.string().optional(),
});

const parentProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  address: z.string().optional(),
});

const tutorProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  affiliation: z.string().optional(),
  address: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
  payoutInfo: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    let profile = null;

    switch (userRole) {
      case 'STUDENT':
        profile = await prisma.student.findUnique({
          where: { id: userId },
          include: {
            parent: {
              select: { id: true, name: true }
            }
          }
        });
        break;
      case 'PARENT':
        profile = await prisma.parent.findUnique({
          where: { id: userId },
          include: {
            students: {
              select: { id: true, name: true }
            }
          }
        });
        break;
      case 'TUTOR':
        profile = await prisma.tutor.findUnique({
          where: { id: userId }
        });
        break;
      case 'ADMIN':
        profile = await prisma.admin.findUnique({
          where: { id: userId }
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const body = await request.json();

    let updatedProfile = null;

    switch (userRole) {
      case 'STUDENT': {
        const validatedData = studentProfileSchema.parse(body);
        updatedProfile = await prisma.student.update({
          where: { id: userId },
          data: {
            name: validatedData.name,
            birthdate: validatedData.birthdate ? new Date(validatedData.birthdate) : undefined,
            gender: validatedData.gender,
            interests: validatedData.interests || [],
            cautions: validatedData.cautions,
          }
        });
        break;
      }
      case 'PARENT': {
        const validatedData = parentProfileSchema.parse(body);
        updatedProfile = await prisma.parent.update({
          where: { id: userId },
          data: {
            name: validatedData.name,
            address: validatedData.address,
          }
        });
        break;
      }
      case 'TUTOR': {
        const validatedData = tutorProfileSchema.parse(body);
        updatedProfile = await prisma.tutor.update({
          where: { id: userId },
          data: {
            name: validatedData.name,
            affiliation: validatedData.affiliation,
            address: validatedData.address,
            specialties: validatedData.specialties || [],
            avatarUrl: validatedData.avatarUrl,
            payoutInfo: validatedData.payoutInfo,
          }
        });
        break;
      }
      default:
        return NextResponse.json({ error: 'Profile update not allowed for this role' }, { status: 403 });
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }

    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}