import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserRole } from '@/lib/user-role';
import { studentProfileSchema } from '@/lib/validation/profile-schemas';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.email);
    if (userRole !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = studentProfileSchema.parse(body);

    const student = await prisma.student.findUnique({
      where: { email: session.user.email }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        lastName: validatedData.lastName,
        firstName: validatedData.firstName,
        lastNameKana: validatedData.lastNameKana,
        firstNameKana: validatedData.firstNameKana,
        nameAlphabet: validatedData.nameAlphabet,
        entryType: validatedData.entryType,
        birthdate: validatedData.birthdate ? new Date(validatedData.birthdate) : undefined,
        gender: validatedData.gender,
        giftedEpisodes: validatedData.giftedEpisodes,
        interests: validatedData.interests || [],
        schoolName: validatedData.schoolName,
        cautions: validatedData.cautions,
        howDidYouKnow: validatedData.howDidYouKnow,
        updatedBy: session.user.email,
      },
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error('Student profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update student profile' },
      { status: 500 }
    );
  }
}