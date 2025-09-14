import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixGoogleOAuthLinking() {
  try {
    const email = 'takayuki.endo@education-beyond.org';
    const googleSubject = '102443701352848174693'; // From the server logs

    console.log('=== Fixing Google OAuth Linking ===');

    // First, let's check what Users exist with this email
    const usersWithEmail = await prisma.user.findMany({
      where: { email },
      include: {
        accounts: true,
        student: true,
      },
    });

    console.log(`Found ${usersWithEmail.length} users with email: ${email}`);

    // Find the user that has the Student relation (this is our target user)
    const targetUser = usersWithEmail.find(user => user.student);
    const orphanedUsers = usersWithEmail.filter(user => !user.student);

    if (!targetUser) {
      console.log('❌ No user with Student relation found!');
      return;
    }

    console.log('✅ Target user (linked to Student):', {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      studentId: targetUser.student?.id,
    });

    // Check if target user already has Google OAuth Account
    const existingGoogleAccount = targetUser.accounts.find(acc => acc.provider === 'google');
    if (existingGoogleAccount) {
      console.log('✅ Target user already has Google OAuth account');
      return;
    }

    // Delete orphaned users (those without roles)
    for (const orphanedUser of orphanedUsers) {
      console.log(`🗑️  Deleting orphaned user: ${orphanedUser.id} (${orphanedUser.email})`);

      // Delete accounts first (foreign key constraint)
      await prisma.account.deleteMany({
        where: { userId: orphanedUser.id },
      });

      // Delete sessions
      await prisma.session.deleteMany({
        where: { userId: orphanedUser.id },
      });

      // Delete user
      await prisma.user.delete({
        where: { id: orphanedUser.id },
      });

      console.log(`✅ Deleted orphaned user: ${orphanedUser.id}`);
    }

    // Create Google OAuth Account record for the target user
    console.log('\n--- Creating Google OAuth Account ---');

    // This is the Account record that would have been created by NextAuth
    const googleAccount = await prisma.account.create({
      data: {
        userId: targetUser.id,
        type: 'oidc',
        provider: 'google',
        providerAccountId: googleSubject,
        // These token fields can be left empty/null for now since we're not storing them
        refresh_token: null,
        access_token: null,
        expires_at: null,
        token_type: 'bearer',
        scope: 'https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/userinfo.email',
        id_token: null,
      },
    });

    console.log('✅ Created Google OAuth Account:', {
      provider: googleAccount.provider,
      providerAccountId: googleAccount.providerAccountId,
      userId: googleAccount.userId,
    });

    console.log('\n🎉 Google OAuth linking fixed!');
    console.log('User should now be able to sign in with Google OAuth.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGoogleOAuthLinking();