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
      name: "山田太郎",
      emailVerified: new Date(),
      passwordHash: await hash("parent123", 10),
    },
  });

  const parent1 = await prisma.parent.create({
    data: {
      email: "test.parent@example.com",
      lastName: "山田",
      firstName: "太郎",
      lastNameKana: "やまだ",
      firstNameKana: "たろう",
      nameAlphabet: "Taro Yamada",
      phoneNumber: "090-1234-5678",
      postalCode: "150-0002",
      prefecture: "東京都",
      city: "渋谷区",
      addressDetail: "渋谷1-1-1",
      userId: parentUser1.id,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  const parentUser2 = await prisma.user.create({
    data: {
      email: "test.parent2@example.com",
      name: "佐藤花子",
      emailVerified: new Date(),
      passwordHash: await hash("parent123", 10),
    },
  });

  const parent2 = await prisma.parent.create({
    data: {
      email: "test.parent2@example.com",
      lastName: "佐藤",
      firstName: "花子",
      lastNameKana: "さとう",
      firstNameKana: "はなこ",
      nameAlphabet: "Hanako Sato",
      phoneNumber: "080-9876-5432",
      postalCode: "220-0012",
      prefecture: "神奈川県",
      city: "横浜市西区",
      addressDetail: "みなとみらい2-2-2",
      userId: parentUser2.id,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create sample students (some with email, some without to test role assignment)
  const student1 = await prisma.student.create({
    data: {
      email: "test.student@example.com",
      entryType: "general",
      lastName: "山田",
      firstName: "美咲",
      lastNameKana: "やまだ",
      firstNameKana: "みさき",
      nameAlphabet: "Misaki Yamada",
      parentId: parent1.id,
      birthdate: new Date("2010-04-15"),
      gender: "FEMALE",
      giftedEpisodes: "3歳で掛け算九九を暗記し、小学校入学前に中学数学の問題を解いていました。論理的思考力が非常に高く、複雑な問題を段階的に分解して解決する能力があります。",
      interests: ["mathematics", "science", "programming"],
      schoolName: "渋谷区立第一小学校",
      cautions: "数学の計算ミスが多いので注意深く指導してください",
      howDidYouKnow: "search",
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Student with no email (will be set by admin later)
  const student2 = await prisma.student.create({
    data: {
      email: null, // No email initially
      entryType: "trial",
      lastName: "佐藤",
      firstName: "健太",
      lastNameKana: "さとう",
      firstNameKana: "けんた",
      nameAlphabet: "Kenta Sato",
      parentId: parent2.id,
      birthdate: new Date("2012-08-22"),
      gender: "MALE",
      giftedEpisodes: "5歳で英語の絵本を読み始め、6歳でバイリンガル並みの会話能力を身につけました。新しい言語を習得する速度が非常に早く、創造的な表現力も豊かです。",
      interests: ["english", "language_stories", "programming"],
      schoolName: "横浜市立港小学校",
      howDidYouKnow: "friend",
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Create a user for student1 (for demonstration)
  const studentUser1 = await prisma.user.create({
    data: {
      email: "test.student@example.com",
      name: "山田美咲",
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
      name: "田中健一",
      emailVerified: new Date(),
      passwordHash: await hash("tutor123", 10),
    },
  });

  const tutor1 = await prisma.tutor.create({
    data: {
      email: "test.tutor@example.com",
      lastName: "田中",
      firstName: "健一",
      lastNameKana: "たなか",
      firstNameKana: "けんいち",
      nameAlphabet: "Kenichi Tanaka",
      phoneNumber: "070-1111-2222",
      postalCode: "160-0022",
      prefecture: "東京都",
      city: "新宿区",
      addressDetail: "新宿3-3-3",
      nearestStation: "JR新宿駅",
      affiliation: "東京大学大学院",
      education: "東京大学理学部数学科卒業、東京大学大学院数理科学研究科修士課程修了",
      specialties: ["mathematics", "physics", "chemistry"],
      selfIntroduction: "数学を中心に10年以上の指導経験があります。生徒一人ひとりの理解度に合わせた丁寧な指導を心がけています。特に論理的思考力の育成に力を入れており、問題解決能力を身につけられるよう指導しています。",
      bankName: "三菱UFJ銀行",
      bankCode: "0005",
      branchName: "新宿支店",
      branchCode: "160",
      accountType: "普通",
      accountNumber: "1234567",
      userId: tutorUser1.id,
      createdBy: "system",
      updatedBy: "system",
    },
  });

  const tutorUser2 = await prisma.user.create({
    data: {
      email: "test.tutor2@example.com",
      name: "鈴木美智子",
      emailVerified: new Date(),
      passwordHash: await hash("tutor123", 10),
    },
  });

  const tutor2 = await prisma.tutor.create({
    data: {
      email: "test.tutor2@example.com",
      lastName: "鈴木",
      firstName: "美智子",
      lastNameKana: "すずき",
      firstNameKana: "みちこ",
      nameAlphabet: "Michiko Suzuki",
      phoneNumber: "080-3333-4444",
      postalCode: "260-0013",
      prefecture: "千葉県",
      city: "千葉市中央区",
      addressDetail: "中央4-4-4",
      nearestStation: "JR千葉駅",
      affiliation: "早稲田大学",
      education: "早稲田大学文学部英文学科卒業、TESOL(英語教授法)修了",
      specialties: ["english", "language_stories", "crafts_art"],
      selfIntroduction: "英語教育に15年間携わっており、特に創造的な英語学習方法の開発に力を入れています。言語学習を通して文化理解も深められるよう、楽しく実践的な指導を行っています。",
      bankName: "みずほ銀行",
      bankCode: "0001",
      branchName: "千葉支店",
      branchCode: "280",
      accountType: "普通",
      accountNumber: "9876543",
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
    - 山田太郎 (Taro Yamada) - 東京都渋谷区
    - 佐藤花子 (Hanako Sato) - 神奈川県横浜市
  - 2 students (1 with User record, 1 without email for testing)
    - 山田美咲 (Misaki Yamada) - 一般エントリー, 渋谷区立第一小学校
    - 佐藤健太 (Kenta Sato) - 体験エントリー, 横浜市立港小学校
  - 2 tutors with User records (passwords: tutor123)
    - 田中健一 (Kenichi Tanaka) - 数学/物理/化学, 東大院
    - 鈴木美智子 (Michiko Suzuki) - 英語/文学/美術, 早稲田大
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
  Parent: test.parent@example.com / parent123 (山田太郎)
  Parent: test.parent2@example.com / parent123 (佐藤花子)
  Tutor: test.tutor@example.com / tutor123 (田中健一)
  Tutor: test.tutor2@example.com / tutor123 (鈴木美智子)
  Student: test.student@example.com (no password - OAuth only)
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
