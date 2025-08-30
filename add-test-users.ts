import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log("🧪 テストユーザーを作成中...\n");

  const hashedPassword = await bcrypt.hash("password123", 12);

  try {
    // テスト用Parent（パスワード付き）
    const testParent = await prisma.parent.create({
      data: {
        email: "test.parent@example.com",
        password: hashedPassword,
        name: "テスト保護者",
        address: "東京都テスト区1-1-1",
        createdBy: "system",
      },
    });
    console.log(`✅ 保護者作成: ${testParent.email}`);

    // テスト用Student（パスワード付き）
    const testStudent = await prisma.student.create({
      data: {
        email: "test.student@example.com",
        password: hashedPassword,
        name: "テスト学生",
        parentId: testParent.id,
        birthdate: new Date("2010-01-01"),
        gender: "MALE",
        interests: ["mathematics", "science"],
        cautions: "テスト用ユーザーです",
        createdBy: "system",
      },
    });
    console.log(`✅ 学生作成: ${testStudent.email}`);

    // テスト用Tutor（パスワード付き）
    const testTutor = await prisma.tutor.create({
      data: {
        email: "test.tutor@example.com",
        password: hashedPassword,
        name: "テストチューター",
        address: "神奈川県テスト市2-2-2",
        affiliation: "テスト大学",
        specialties: ["mathematics", "english", "science"],
        createdBy: "system",
      },
    });
    console.log(`✅ チューター作成: ${testTutor.email}`);

    // テスト用Admin（パスワード付き）
    const testAdmin = await prisma.admin.create({
      data: {
        email: "test.admin@example.com",
        password: hashedPassword,
        name: "テスト管理者",
        role: "ADMIN",
        createdBy: "system",
      },
    });
    console.log(`✅ 管理者作成: ${testAdmin.email}`);

    // サンプルペアリング
    const pairing = await prisma.pairing.create({
      data: {
        studentId: testStudent.id,
        tutorId: testTutor.id,
        status: "ACTIVE",
        score: 0.9,
        startedAt: new Date(),
        createdBy: "system",
      },
    });
    console.log(`✅ ペアリング作成: ${testStudent.name} ↔ ${testTutor.name}`);

    // サンプル稼働枠
    const availability = await prisma.availability.create({
      data: {
        tutorId: testTutor.id,
        startAt: new Date("2025-09-01T14:00:00Z"),
        endAt: new Date("2025-09-01T16:00:00Z"),
        createdBy: "system",
      },
    });
    console.log(`✅ 稼働枠作成: ${testTutor.name} (9/1 14:00-16:00)`);

    // サンプル学習記録
    const learningRecord = await prisma.learningRecord.create({
      data: {
        studentId: testStudent.id,
        tutorId: testTutor.id,
        date: new Date("2025-08-30"),
        summary: "数学の基本的な方程式について学習しました。一次方程式の解き方を理解し、練習問題を解くことができました。",
        materials: ["数学教科書", "練習プリント"],
        durationMin: 90,
        score: 4,
        tags: ["mathematics", "equations"],
        createdBy: "system",
      },
    });
    console.log(`✅ 学習記録作成: ${learningRecord.date.toLocaleDateString()}`);

    console.log("\n🎉 テストユーザー作成完了！");
    console.log("\n📋 ログイン情報:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👨‍💼 保護者:");
    console.log(`   📧 Email: test.parent@example.com`);
    console.log(`   🔑 Password: password123`);
    console.log("");
    console.log("🎓 学生:");
    console.log(`   📧 Email: test.student@example.com`);
    console.log(`   🔑 Password: password123`);
    console.log("");
    console.log("👩‍🏫 チューター:");
    console.log(`   📧 Email: test.tutor@example.com`);
    console.log(`   🔑 Password: password123`);
    console.log("");
    console.log("⚙️ 管理者:");
    console.log(`   📧 Email: test.admin@example.com`);
    console.log(`   🔑 Password: password123`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      console.log("⚠️  テストユーザーは既に存在します");
      console.log("\n📋 ログイン情報:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("👨‍💼 保護者: test.parent@example.com");
      console.log("🎓 学生: test.student@example.com");
      console.log("👩‍🏫 チューター: test.tutor@example.com");
      console.log("⚙️ 管理者: test.admin@example.com");
      console.log("");
      console.log("🔑 共通パスワード: password123");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } else {
      console.error('Error creating test users:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers().catch(console.error);