import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUsers() {
  console.log('🔄 既存ユーザーデータを users テーブルに移行中...');

  try {
    // Students を移行
    const students = await prisma.student.findMany({
      where: {
        password: { not: null },
        userId: null, // まだリンクされていないもののみ
      },
    });

    for (const student of students) {
      if (!student.password) continue;

      // users テーブルに作成
      const user = await prisma.user.create({
        data: {
          email: student.email,
          name: student.name,
          passwordHash: student.password, // 既存のハッシュ済みパスワードをコピー
        },
      });

      // student に userId をリンク
      await prisma.student.update({
        where: { id: student.id },
        data: { userId: user.id },
      });

      console.log(`✅ Student: ${student.email} -> User ID: ${user.id}`);
    }

    // Parents を移行
    const parents = await prisma.parent.findMany({
      where: {
        password: { not: null },
        userId: null,
      },
    });

    for (const parent of parents) {
      if (!parent.password) continue;

      const user = await prisma.user.create({
        data: {
          email: parent.email,
          name: parent.name,
          passwordHash: parent.password,
        },
      });

      await prisma.parent.update({
        where: { id: parent.id },
        data: { userId: user.id },
      });

      console.log(`✅ Parent: ${parent.email} -> User ID: ${user.id}`);
    }

    // Tutors を移行
    const tutors = await prisma.tutor.findMany({
      where: {
        password: { not: null },
        userId: null,
      },
    });

    for (const tutor of tutors) {
      if (!tutor.password) continue;

      const user = await prisma.user.create({
        data: {
          email: tutor.email,
          name: `${tutor.lastName} ${tutor.firstName}`,
          passwordHash: tutor.password,
        },
      });

      await prisma.tutor.update({
        where: { id: tutor.id },
        data: { userId: user.id },
      });

      console.log(`✅ Tutor: ${tutor.email} -> User ID: ${user.id}`);
    }

    // Admins を移行
    const admins = await prisma.admin.findMany({
      where: {
        password: { not: null },
        userId: null,
      },
    });

    for (const admin of admins) {
      if (!admin.password) continue;

      const user = await prisma.user.create({
        data: {
          email: admin.email,
          name: admin.name,
          passwordHash: admin.password,
        },
      });

      await prisma.admin.update({
        where: { id: admin.id },
        data: { userId: user.id },
      });

      console.log(`✅ Admin: ${admin.email} -> User ID: ${user.id}`);
    }

    const totalMigrated = students.length + parents.length + tutors.length + admins.length;
    console.log(`\n🎉 移行完了！ ${totalMigrated} 人のユーザーを移行しました。`);

  } catch (error) {
    console.error('❌ 移行中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
migrateUsers();