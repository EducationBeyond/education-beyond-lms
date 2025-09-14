import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create test admin user first
  const adminUser = await prisma.user.create({
    data: {
      email: "test.admin@example.com",
      name: "テスト管理者",
      emailVerified: new Date(),
      passwordHash: await hash("admin123", 10),
    },
  });

  // Create admin record linked to user
  const admin1 = await prisma.admin.create({
    data: {
      email: "test.admin@example.com",
      name: "テスト管理者",
      role: "SUPER_ADMIN",
      userId: adminUser.id,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create parent users and records
  const parentUser1 = await prisma.user.create({
    data: {
      email: "test.parent@example.com",
      name: "テスト保護者",
      emailVerified: new Date(),
      passwordHash: await hash("parent123", 10),
    },
  });

  const parent1 = await prisma.parent.create({
    data: {
      email: "test.parent@example.com",
      name: "テスト保護者",
      address: "東京都渋谷区1-1-1",
      userId: parentUser1.id,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  const parentUser2 = await prisma.user.create({
    data: {
      email: "test.parent2@example.com",
      name: "テスト保護者2",
      emailVerified: new Date(),
      passwordHash: await hash("parent123", 10),
    },
  });

  const parent2 = await prisma.parent.create({
    data: {
      email: "test.parent2@example.com",
      name: "テスト保護者2",
      address: "神奈川県横浜市2-2-2",
      userId: parentUser2.id,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create sample students (some with email, some without to test role assignment)
  const student1 = await prisma.student.create({
    data: {
      email: "test.student@example.com",
      name: "テスト学生",
      furigana: "てすと がくせい",
      parentId: parent1.id,
      birthdate: new Date("2010-04-15"),
      gender: "FEMALE",
      giftedTraits: ["数学的思考力", "論理的推理能力"],
      interests: ["mathematics", "science", "reading"],
      cautions: "数学の計算ミスが多いので注意深く指導してください",
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Student with no email (will be set by admin later)
  const student2 = await prisma.student.create({
    data: {
      email: null, // No email initially
      name: "テスト学生2",
      furigana: "てすと がくせい2",
      parentId: parent2.id,
      birthdate: new Date("2012-08-22"),
      gender: "MALE",
      giftedTraits: ["語学習得能力", "創造性"],
      interests: ["english", "programming", "sports"],
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create a user for student1 (for demonstration)
  const studentUser1 = await prisma.user.create({
    data: {
      email: "test.student@example.com",
      name: "テスト学生",
      emailVerified: new Date(),
    },
  });

  // Link student1 to user
  await prisma.student.update({
    where: { id: student1.id },
    data: { userId: studentUser1.id },
  });

  // Create tutor users and records
  const tutorUser1 = await prisma.user.create({
    data: {
      email: "test.tutor@example.com",
      name: "テストチューター",
      emailVerified: new Date(),
      passwordHash: await hash("tutor123", 10),
    },
  });

  const tutor1 = await prisma.tutor.create({
    data: {
      email: "test.tutor@example.com",
      name: "テストチューター",
      furigana: "やまだ たろう",
      address: "東京都新宿区3-3-3",
      affiliation: "東京大学大学院",
      specialties: ["mathematics", "physics", "chemistry"],
      avatarUrl: "https://example.com/avatars/yamada.jpg",
      bankAccountInfo: {
        bankName: "三菱UFJ銀行",
        branchName: "新宿支店",
        accountType: "普通",
        accountNumber: "1234567"
      },
      userId: tutorUser1.id,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  const tutorUser2 = await prisma.user.create({
    data: {
      email: "test.tutor2@example.com",
      name: "テストチューター2",
      emailVerified: new Date(),
      passwordHash: await hash("tutor123", 10),
    },
  });

  const tutor2 = await prisma.tutor.create({
    data: {
      email: "test.tutor2@example.com",
      name: "テストチューター2",
      furigana: "さとう はなこ",
      address: "千葉県千葉市4-4-4",
      affiliation: "早稲田大学",
      specialties: ["english", "literature", "writing"],
      userId: tutorUser2.id,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create sample pairings
  const pairing1 = await prisma.pairing.create({
    data: {
      studentId: student1.id,
      tutorId: tutor1.id,
      status: "ACTIVE",
      score: 0.85,
      startedAt: new Date("2025-01-15"),
      createdBy: "system",
      updatedBy: "system",
    },
  });

  const pairing2 = await prisma.pairing.create({
    data: {
      studentId: student2.id,
      tutorId: tutor2.id,
      status: "PENDING",
      score: 0.72,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create sample availability
  const availability1 = await prisma.availability.create({
    data: {
      tutorId: tutor1.id,
      startAt: new Date("2025-09-15T10:00:00Z"),
      endAt: new Date("2025-09-15T12:00:00Z"),
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create sample reservations
  const reservation1 = await prisma.reservation.create({
    data: {
      studentId: student1.id,
      tutorId: tutor1.id,
      startAt: new Date("2025-09-15T10:00:00Z"),
      endAt: new Date("2025-09-15T11:30:00Z"),
      channel: "MEET",
      status: "CONFIRMED",
      notes: "数学の二次方程式の指導",
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create sample learning record
  const learningRecord1 = await prisma.learningRecord.create({
    data: {
      studentId: student1.id,
      tutorId: tutor1.id,
      date: new Date("2025-09-13"),
      summary: "二次方程式の解き方を学習しました。判別式の使い方について理解が深まりました。",
      materials: ["教科書 数学I 第3章", "問題集 応用編 p.45-50"],
      durationMin: 90,
      score: 4,
      tags: ["mathematics", "quadratic-equation", "discriminant"],
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create sample calendar event
  const calendarEvent1 = await prisma.calendarEvent.create({
    data: {
      reservationId: reservation1.id,
      provider: "GOOGLE",
      externalId: "google-event-123456",
      joinUrl: "https://meet.google.com/abc-defg-hij",
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create sample payment
  const payment1 = await prisma.payment.create({
    data: {
      parentId: parent1.id,
      provider: "MONEYFORWARD",
      externalId: "mf-payment-789012",
      amount: 15000.00,
      currency: "JPY",
      status: "PAID",
      receivedAt: new Date("2025-09-10T09:30:00Z"),
      dueDate: new Date("2025-09-30"),
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create sample CRM contacts
  const crmContact1 = await prisma.cRMContact.create({
    data: {
      provider: "HUBSPOT",
      externalId: "hubspot-contact-345678",
      entityType: "PARENT",
      entityId: parent1.id,
      email: parent1.email,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create sample message link
  const messageLink1 = await prisma.messageLink.create({
    data: {
      provider: "LINE",
      externalId: "line-channel-901234",
      channelUrl: "https://line.me/ti/g2/abc123",
      entityType: "PARENT",
      entityId: parent1.id,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create an unassigned Google OAuth user for testing role assignment
  const unassignedUser = await prisma.user.create({
    data: {
      email: "unassigned.user@gmail.com",
      name: "Unassigned Test User",
      emailVerified: new Date(),
      image: "https://lh3.googleusercontent.com/a/default-user-avatar.jpg",
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log(`Created:
  - 1 super admin (test.admin@example.com / admin123)
  - 2 parents with User records (passwords: parent123)
  - 2 students (1 with User record, 1 without email for testing)
  - 2 tutors with User records (passwords: tutor123)
  - 2 pairings (1 active, 1 pending)
  - 1 availability slot
  - 1 reservation (confirmed)
  - 1 learning record
  - 1 calendar event
  - 1 payment (paid)
  - 1 CRM contact
  - 1 message link
  - 1 unassigned OAuth user for role assignment testing

Test accounts:
  Admin: test.admin@example.com / admin123
  Parent: test.parent@example.com / parent123
  Tutor: test.tutor@example.com / tutor123
  Unassigned User: unassigned.user@gmail.com (OAuth only)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
