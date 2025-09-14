import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRoleQuery() {
  try {
    const email = 'takayuki.endo@education-beyond.org';

    console.log('=== Testing Role Query ===');
    console.log(`Email: ${email}`);

    // This is the exact query from getUserRole function
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: { select: { id: true } },
        parent: { select: { id: true } },
        tutor: { select: { id: true } },
        admin: { select: { id: true } }
      }
    });

    console.log('\n--- Query Result ---');
    if (user) {
      console.log('User found:');
      console.log('- ID:', user.id);
      console.log('- Email:', user.email);
      console.log('- Name:', user.name);
      console.log('- Student relation:', user.student);
      console.log('- Parent relation:', user.parent);
      console.log('- Tutor relation:', user.tutor);
      console.log('- Admin relation:', user.admin);

      console.log('\n--- Role Check ---');
      console.log('hasStudent:', !!user.student);
      console.log('hasParent:', !!user.parent);
      console.log('hasTutor:', !!user.tutor);
      console.log('hasAdmin:', !!user.admin);

      // Determine role
      let role = null;
      if (user.admin) role = 'admin';
      else if (user.tutor) role = 'tutor';
      else if (user.parent) role = 'parent';
      else if (user.student) role = 'student';

      console.log('Determined role:', role);
    } else {
      console.log('❌ User not found');
    }

    // Let's also test a direct Student lookup
    console.log('\n--- Direct Student Lookup ---');
    const studentDirectLookup = await prisma.student.findFirst({
      where: { email },
      include: { user: true },
    });

    if (studentDirectLookup) {
      console.log('Student found via direct lookup:');
      console.log('- Student ID:', studentDirectLookup.id);
      console.log('- Student email:', studentDirectLookup.email);
      console.log('- Student userId:', studentDirectLookup.userId);
      console.log('- Linked User:', studentDirectLookup.user ? {
        id: studentDirectLookup.user.id,
        email: studentDirectLookup.user.email,
      } : 'null');
    } else {
      console.log('❌ No student found via direct lookup');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoleQuery();