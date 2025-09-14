import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUserLink() {
  try {
    const email = 'takayuki.endo@education-beyond.org';
    const studentId = 'cmfj973qe00029keh6u473c9x';

    console.log('=== Detailed Debug ===');

    // Check User records with this email
    const users = await prisma.user.findMany({
      where: { email },
    });

    console.log('\n--- All User records with this email ---');
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      });
    });

    // Check Student record
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    console.log('\n--- Student record ---');
    if (student) {
      console.log('Student:', {
        id: student.id,
        name: student.name,
        email: student.email,
        userId: student.userId,
        createdAt: student.createdAt,
      });

      // Check if the userId points to a valid User
      if (student.userId) {
        const linkedUser = await prisma.user.findUnique({
          where: { id: student.userId },
        });

        console.log('\n--- User linked to Student ---');
        if (linkedUser) {
          console.log('Linked User:', {
            id: linkedUser.id,
            email: linkedUser.email,
            name: linkedUser.name,
            emailVerified: linkedUser.emailVerified,
          });

          // Check if the emails match
          if (linkedUser.email === email) {
            console.log('✅ Emails match between User and Student');
          } else {
            console.log('❌ Email mismatch!');
            console.log(`Student email: ${student.email}`);
            console.log(`Linked User email: ${linkedUser.email}`);
          }
        } else {
          console.log('❌ Student.userId points to non-existent User');
        }
      } else {
        console.log('❌ Student has no userId set');
      }
    }

    // Check for orphaned User records
    console.log('\n--- Checking for orphaned Users ---');
    for (const user of users) {
      const studentWithThisUser = await prisma.student.findFirst({
        where: { userId: user.id },
      });

      if (!studentWithThisUser) {
        console.log(`❌ User ${user.id} (${user.email}) is not linked to any Student`);
      } else {
        console.log(`✅ User ${user.id} is linked to Student ${studentWithThisUser.id}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserLink();