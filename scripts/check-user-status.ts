import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserStatus() {
  try {
    const email = 'takayuki.endo@education-beyond.org';
    const studentId = 'cmfj973qe00029keh6u473c9x';

    console.log('=== Checking User Status ===');
    console.log(`Email: ${email}`);
    console.log(`Student ID: ${studentId}`);

    // Check User table
    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log('\n--- User table ---');
    if (user) {
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      });
    } else {
      console.log('❌ User not found in User table');
    }

    // Check Student table
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { parent: true },
    });

    console.log('\n--- Student table ---');
    if (student) {
      console.log('✅ Student found:', {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        userId: student.userId,
        parent: student.parent ? `${student.parent.firstName} ${student.parent.lastName}` : null,
      });
    } else {
      console.log('❌ Student not found');
    }

    // Check if they're linked
    console.log('\n--- Link status ---');
    if (user && student) {
      if (student.userId === user.id) {
        console.log('✅ User and Student are properly linked');
      } else {
        console.log('❌ User and Student are NOT linked');
        console.log(`User ID: ${user.id}`);
        console.log(`Student userId: ${student.userId}`);
      }
    } else {
      console.log('❌ Cannot check link status - missing User or Student');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStatus();