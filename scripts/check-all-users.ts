import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllUsers() {
  try {
    const email = 'takayuki.endo@education-beyond.org';

    console.log('=== Checking All User Records ===');

    // Get all users with this email
    const users = await prisma.user.findMany({
      where: { email },
    });

    console.log(`Found ${users.length} user(s) with email: ${email}`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n--- User ${i + 1} ---`);
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Created:', user.createdAt);

      // Check what this specific user is linked to
      const userWithRoles = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          student: { select: { id: true, name: true } },
          parent: { select: { id: true, name: true } },
          tutor: { select: { id: true, name: true } },
          admin: { select: { id: true, name: true } }
        }
      });

      if (userWithRoles) {
        console.log('Roles for this user:');
        console.log('- Student:', userWithRoles.student);
        console.log('- Parent:', userWithRoles.parent);
        console.log('- Tutor:', userWithRoles.tutor);
        console.log('- Admin:', userWithRoles.admin);
      }
    }

    // Check if there's another user with this ID that was referenced in the server logs
    const userIdFromLogs = 'cmfj19hhk00009khr0q6vcas5'; // This ID appeared in the server logs
    console.log(`\n--- Checking User ID from server logs: ${userIdFromLogs} ---`);

    const userFromLogs = await prisma.user.findUnique({
      where: { id: userIdFromLogs },
      include: {
        student: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
        tutor: { select: { id: true, name: true } },
        admin: { select: { id: true, name: true } }
      }
    });

    if (userFromLogs) {
      console.log('Found user from server logs:');
      console.log('ID:', userFromLogs.id);
      console.log('Email:', userFromLogs.email);
      console.log('Name:', userFromLogs.name);
      console.log('Student relation:', userFromLogs.student);
      console.log('Parent relation:', userFromLogs.parent);
      console.log('Tutor relation:', userFromLogs.tutor);
      console.log('Admin relation:', userFromLogs.admin);
    } else {
      console.log('User ID from server logs not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();