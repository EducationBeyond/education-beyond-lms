import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGoogleOAuthAccount() {
  try {
    const email = 'takayuki.endo@education-beyond.org';

    console.log('=== Checking Google OAuth Account Records ===');

    // Check Google OAuth accounts
    const googleAccounts = await prisma.account.findMany({
      where: { provider: 'google' },
      include: { user: true },
    });

    console.log(`Found ${googleAccounts.length} Google OAuth account(s)`);

    for (let i = 0; i < googleAccounts.length; i++) {
      const account = googleAccounts[i];
      console.log(`\n--- Google Account ${i + 1} ---`);
      console.log('Provider Account ID:', account.providerAccountId);
      console.log('User ID:', account.userId);
      console.log('User details:', {
        id: account.user.id,
        email: account.user.email,
        name: account.user.name,
      });

      // Check if this user has the target email
      if (account.user.email === email) {
        console.log('🎯 This is the Google account for our target email!');

        // Check what roles this user has
        const userWithRoles = await prisma.user.findUnique({
          where: { id: account.user.id },
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            parent: { select: { id: true, firstName: true, lastName: true } },
            tutor: { select: { id: true, firstName: true, lastName: true } },
            admin: { select: { id: true, name: true } }
          }
        });

        if (userWithRoles) {
          console.log('Roles for this OAuth user:');
          console.log('- Student:', userWithRoles.student);
          console.log('- Parent:', userWithRoles.parent);
          console.log('- Tutor:', userWithRoles.tutor);
          console.log('- Admin:', userWithRoles.admin);
        }
      }
    }

    // Check if there are any accounts for the correct user ID
    const correctUserId = 'cmfj9gnja00009k8r8oaqexag';
    console.log(`\n--- Checking accounts for correct user ID: ${correctUserId} ---`);

    const accountsForCorrectUser = await prisma.account.findMany({
      where: { userId: correctUserId },
      include: { user: true },
    });

    console.log(`Found ${accountsForCorrectUser.length} account(s) for the correct user`);
    accountsForCorrectUser.forEach((account, i) => {
      console.log(`Account ${i + 1}:`, {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        userEmail: account.user.email,
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGoogleOAuthAccount();