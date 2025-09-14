import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getUserRole } from '@/lib/user-role';

const prisma = new PrismaClient();

const studentProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  furigana: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  birthdate: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  giftedTraits: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  cautions: z.string().optional().nullable(),
});

const parentProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  address: z.string().optional().nullable(),
});

const tutorProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  furigana: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  affiliation: z.string().optional().nullable(),
  specialties: z.array(z.string()).optional(),
  avatarUrl: z.string().optional().nullable(),
  bankAccountInfo: z.union([z.string(), z.object({}).passthrough()]).optional().nullable(),
  interviewCalendarUrl: z.string().optional().nullable(),
  lessonCalendarUrl: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.email);
    let profile = null;

    switch (userRole) {
      case 'student':
        profile = await prisma.student.findUnique({
          where: { email: session.user.email },
          include: {
            parent: {
              select: { id: true, name: true }
            }
          }
        });
        break;
      case 'parent':
        profile = await prisma.parent.findUnique({
          where: { email: session.user.email },
          include: {
            students: {
              select: { id: true, name: true }
            }
          }
        });
        break;
      case 'tutor':
        profile = await prisma.tutor.findUnique({
          where: { email: session.user.email }
        });
        break;
      case 'admin':
        profile = await prisma.admin.findUnique({
          where: { email: session.user.email }
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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.email);
    const body = await request.json();
    
    console.log('[API Profile] Update request:', {
      userRole,
      email: session.user.email,
      body: body
    });
    
    let updatedProfile = null;

    switch (userRole) {
      case 'student': {
        const validatedData = studentProfileSchema.parse(body);
        updatedProfile = await prisma.student.update({
          where: { email: session.user.email },
          data: {
            name: validatedData.name,
            furigana: validatedData.furigana || null,
            address: validatedData.address || null,
            birthdate: validatedData.birthdate ? new Date(validatedData.birthdate) : null,
            gender: validatedData.gender || null,
            giftedTraits: validatedData.giftedTraits || [],
            interests: validatedData.interests || [],
            cautions: validatedData.cautions || null,
          }
        });
        break;
      }
      case 'parent': {
        const validatedData = parentProfileSchema.parse(body);
        updatedProfile = await prisma.parent.update({
          where: { email: session.user.email },
          data: {
            name: validatedData.name,
            address: validatedData.address || null,
          }
        });
        break;
      }
      case 'tutor': {
        const validatedData = tutorProfileSchema.parse(body);
        console.log('[API Profile] Validated data for tutor:', validatedData);
        
        const updateData: any = {
          name: validatedData.name,
          furigana: validatedData.furigana || null,
          affiliation: validatedData.affiliation || null,
          address: validatedData.address || null,
          specialties: validatedData.specialties || [],
          avatarUrl: validatedData.avatarUrl || null,
          interviewCalendarUrl: validatedData.interviewCalendarUrl || null,
          lessonCalendarUrl: validatedData.lessonCalendarUrl || null,
        };

        // Handle bankAccountInfo - convert string to JSON or set as null
        if (validatedData.bankAccountInfo) {
          updateData.bankAccountInfo = validatedData.bankAccountInfo;
        }
        
        console.log('[API Profile] Update data:', updateData);
        
        updatedProfile = await prisma.tutor.update({
          where: { email: session.user.email },
          data: updateData
        });
        break;
      }
      default:
        return NextResponse.json({ error: 'Profile update not allowed for this role' }, { status: 403 });
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[API Profile] Validation error:', error.issues);
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }

    console.error('[API Profile] Update error:', error);
    console.error('[API Profile] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}