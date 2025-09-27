import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/auth';

const setupRoleSchema = z.object({
  email: z.string().email(),
  role: z.enum(['STUDENT', 'PARENT', 'TUTOR']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role } = setupRoleSchema.parse(body);

    // セッションのメールアドレスと一致するかチェック
    if (email !== session.user.email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
    }

    // 既存のロール設定があるかチェック
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Role already set' }, { status: 409 });
    }

    // ロールに応じてユーザーを作成
    let result;

    switch (role) {
      case 'STUDENT':
        // Studentの場合は、Parentレコードも必要なので一時的な対応
        // 実際の運用では、Parentが先に登録されている必要がある
        const userName = session.user.name || 'Unknown Student';
        const [firstName, lastName] = userName.split(' ').length > 1
          ? [userName.split(' ')[1], userName.split(' ')[0]]
          : [userName, ''];

        result = await prisma.student.create({
          data: {
            email,
            firstName,
            lastName,
            lastNameKana: '',
            firstNameKana: '',
            nameAlphabet: '',
            birthdate: new Date('2000-01-01'),
            gender: 'OTHER',
            giftedEpisodes: '',
            interests: [],
            schoolName: '',
            cautions: '',
            howDidYouKnow: '',
            parent: {
              create: {
                email: `temp.parent.${Date.now()}@temp.example.com`,
                firstName: '未設定',
                lastName: `${lastName}の保護者`,
                lastNameKana: '',
                firstNameKana: '',
                nameAlphabet: '',
                phoneNumber: '',
                postalCode: '',
                prefecture: '',
                city: '',
                addressDetail: '',
                userId: `temp-parent-${Date.now()}`,
              },
            },
          },
        });
        break;

      case 'PARENT':
        const parentName = session.user.name || 'Unknown Parent';
        const [parentFirstName, parentLastName] = parentName.split(' ').length > 1
          ? [parentName.split(' ')[1], parentName.split(' ')[0]]
          : [parentName, ''];

        result = await prisma.parent.create({
          data: {
            email: email,
            firstName: parentFirstName,
            lastName: parentLastName,
            lastNameKana: '',
            firstNameKana: '',
            nameAlphabet: '',
            phoneNumber: '',
            postalCode: '',
            prefecture: '',
            city: '',
            addressDetail: '',
            userId: `parent-${Date.now()}`,
          },
        });
        break;

      case 'TUTOR':
        const tutorName = session.user.name || 'Unknown Tutor';
        const [tutorFirstName, tutorLastName] = tutorName.split(' ').length > 1
          ? [tutorName.split(' ')[1], tutorName.split(' ')[0]]
          : [tutorName, ''];

        result = await prisma.tutor.create({
          data: {
            email,
            firstName: tutorFirstName,
            lastName: tutorLastName,
            lastNameKana: '',
            firstNameKana: '',
            nameAlphabet: '',
            phoneNumber: '',
            postalCode: '',
            prefecture: '',
            city: '',
            addressDetail: '',
            nearestStation: '',
            affiliation: '',
            education: '',
            specialties: [],
            selfIntroduction: '',
            bankName: '',
            bankCode: '',
            branchName: '',
            branchCode: '',
            accountType: '',
            accountNumber: '',
            userId: `tutor-${Date.now()}`,
          },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      role,
      entityId: result.id 
    });

  } catch (error) {
    console.error('Setup role error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: error.issues 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// ユーザー存在確認のヘルパー関数
async function findUserByEmail(email: string): Promise<boolean> {
  try {
    const [student, parent, tutor, admin] = await Promise.all([
      prisma.student.findUnique({ where: { email: email } }),
      prisma.parent.findUnique({ where: { email: email } }),
      prisma.tutor.findUnique({ where: { email: email } }),
      prisma.admin.findUnique({ where: { email: email } }),
    ]);

    return !!(student || parent || tutor || admin);
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}