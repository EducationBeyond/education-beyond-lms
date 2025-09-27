import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStudentUser() {
  try {
    const studentId = 'cmfj973qe00029keh6u473c9x';
    const email = 'takayuki.endo@education-beyond.org';

    // 参加者データを取得
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      console.error('Student not found');
      return;
    }

    console.log('Found student:', `${student.firstName} ${student.lastName}`);

    // 既存のUserレコードをチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists, linking to student...');

      // 参加者のuserIdを更新
      await prisma.student.update({
        where: { id: studentId },
        data: { userId: existingUser.id },
      });

      console.log('✅ Student linked to existing user');
    } else {
      console.log('Creating new User and linking...');

      await prisma.$transaction(async (tx) => {
        // 1. Userレコードを作成
        const user = await tx.user.create({
          data: {
            email: email,
            name: `${student.firstName} ${student.lastName}`,
            emailVerified: new Date(),
          },
        });

        // 2. 参加者のuserIdを更新
        await tx.student.update({
          where: { id: studentId },
          data: { userId: user.id },
        });

        console.log('✅ User created and linked to student');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStudentUser();
