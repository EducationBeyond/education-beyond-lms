import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserRole } from '@/lib/user-role';
import { parentProfileSchema } from '@/lib/validation/profile-schemas';

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
    const validatedData = parentProfileSchema.parse(body);

    const student = await prisma.student.findUnique({
      where: { email: session.user.email },
      include: { parent: true }
    });

    if (!student?.parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const updatedParent = await prisma.parent.update({
      where: { id: student.parent.id },
      data: {
        lastName: validatedData.lastName,
        firstName: validatedData.firstName,
        lastNameKana: validatedData.lastNameKana,
        firstNameKana: validatedData.firstNameKana,
        nameAlphabet: validatedData.nameAlphabet,
        phoneNumber: validatedData.phoneNumber,
        postalCode: validatedData.postalCode,
        prefecture: validatedData.prefecture,
        city: validatedData.city,
        addressDetail: validatedData.addressDetail,
        updatedBy: session.user.email,
      },
    });

    return NextResponse.json({ success: true, parent: updatedParent });
  } catch (error) {
    console.error('Parent profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update parent profile' },
      { status: 500 }
    );
  }
}