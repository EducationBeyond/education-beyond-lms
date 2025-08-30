import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create sample parents
  const parent1 = await prisma.parent.create({
    data: {
      email: "tanaka.hiroshi@example.com",
      name: "田中 寛",
      address: "東京都渋谷区1-1-1",
      createdBy: "system",
    },
  });

  const parent2 = await prisma.parent.create({
    data: {
      email: "suzuki.akiko@example.com", 
      name: "鈴木 明子",
      address: "神奈川県横浜市2-2-2",
      createdBy: "system",
    },
  });

  // Create sample students
  const student1 = await prisma.student.create({
    data: {
      email: "tanaka.yuki@student.example.com",
      name: "田中 由紀",
      parentId: parent1.id,
      birthdate: new Date("2010-04-15"),
      gender: "FEMALE",
      interests: ["mathematics", "science", "reading"],
      cautions: "数学の計算ミスが多いので注意深く指導してください",
      createdBy: "system",
    },
  });

  const student2 = await prisma.student.create({
    data: {
      email: "suzuki.kenta@student.example.com",
      name: "鈴木 健太",
      parentId: parent2.id,
      birthdate: new Date("2012-08-22"),
      gender: "MALE",
      interests: ["english", "programming", "sports"],
      createdBy: "system",
    },
  });

  // Create sample tutors
  const tutor1 = await prisma.tutor.create({
    data: {
      email: "yamada.sensei@tutor.example.com",
      name: "山田 太郎",
      address: "東京都新宿区3-3-3",
      affiliation: "東京大学大学院",
      specialties: ["mathematics", "physics", "chemistry"],
      avatarUrl: "https://example.com/avatars/yamada.jpg",
      payoutInfo: {
        bankName: "三菱UFJ銀行",
        branchName: "新宿支店",
        accountType: "普通",
        accountNumber: "1234567"
      },
      createdBy: "system",
    },
  });

  const tutor2 = await prisma.tutor.create({
    data: {
      email: "sato.sensei@tutor.example.com",
      name: "佐藤 花子",
      address: "千葉県千葉市4-4-4",
      affiliation: "早稲田大学",
      specialties: ["english", "literature", "writing"],
      createdBy: "system",
    },
  });

  // Create sample admin
  const admin1 = await prisma.admin.create({
    data: {
      email: "admin@educationbeyond.com",
      name: "管理者",
      role: "SUPER_ADMIN",
      createdBy: "system",
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
    },
  });

  const pairing2 = await prisma.pairing.create({
    data: {
      studentId: student2.id,
      tutorId: tutor2.id,
      status: "PENDING",
      score: 0.72,
      createdBy: "system",
    },
  });

  // Create sample availability
  const availability1 = await prisma.availability.create({
    data: {
      tutorId: tutor1.id,
      startAt: new Date("2025-08-31T10:00:00Z"),
      endAt: new Date("2025-08-31T12:00:00Z"),
      createdBy: "system",
    },
  });

  // Create sample reservations
  const reservation1 = await prisma.reservation.create({
    data: {
      studentId: student1.id,
      tutorId: tutor1.id,
      startAt: new Date("2025-08-31T10:00:00Z"),
      endAt: new Date("2025-08-31T11:30:00Z"),
      channel: "MEET",
      status: "CONFIRMED",
      notes: "数学の二次方程式の指導",
      createdBy: "system",
    },
  });

  // Create sample learning record
  const learningRecord1 = await prisma.learningRecord.create({
    data: {
      studentId: student1.id,
      tutorId: tutor1.id,
      date: new Date("2025-08-30"),
      summary: "二次方程式の解き方を学習しました。判別式の使い方について理解が深まりました。",
      materials: ["教科書 数学I 第3章", "問題集 応用編 p.45-50"],
      durationMin: 90,
      score: 4,
      tags: ["mathematics", "quadratic-equation", "discriminant"],
      createdBy: "system",
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
      receivedAt: new Date("2025-08-25T09:30:00Z"),
      dueDate: new Date("2025-08-31"),
      createdBy: "system",
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
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log(`Created:
  - ${1} super admin
  - ${2} parents
  - ${2} students  
  - ${2} tutors
  - ${2} pairings
  - ${1} availability slot
  - ${1} reservation
  - ${1} learning record
  - ${1} calendar event
  - ${1} payment
  - ${1} CRM contact
  - ${1} message link`);
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