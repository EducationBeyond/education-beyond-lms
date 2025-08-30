const { PrismaClient } = require('@prisma/client');

async function checkSeedData() {
  console.log('🔍 シードデータ確認スクリプト開始...\n');
  
  const prisma = new PrismaClient({
    log: ['warn', 'error'], // エラーログのみ表示
  });

  try {
    console.log('📊 データベース接続テスト...');
    await prisma.$connect();
    console.log('✅ データベース接続成功！\n');

    // テーブル一覧とレコード数を確認
    console.log('📋 各テーブルのレコード数:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');

    const counts = await Promise.all([
      prisma.parent.count().then(count => ({ table: 'Parents (保護者)', count })),
      prisma.student.count().then(count => ({ table: 'Students (学生)', count })),
      prisma.tutor.count().then(count => ({ table: 'Tutors (チューター)', count })),
      prisma.admin.count().then(count => ({ table: 'Admins (管理者)', count })),
      prisma.learningRecord.count().then(count => ({ table: 'Learning Records (学習記録)', count })),
      prisma.reservation.count().then(count => ({ table: 'Reservations (予約)', count })),
      prisma.pairing.count().then(count => ({ table: 'Pairings (ペアリング)', count })),
      prisma.availability.count().then(count => ({ table: 'Availabilities (稼働枠)', count })),
      prisma.calendarEvent.count().then(count => ({ table: 'Calendar Events (カレンダー)', count })),
      prisma.payment.count().then(count => ({ table: 'Payments (支払い)', count })),
      prisma.cRMContact.count().then(count => ({ table: 'CRM Contacts (CRM連絡先)', count })),
      prisma.messageLink.count().then(count => ({ table: 'Message Links (メッセージ)', count })),
    ]);

    counts.forEach(({ table, count }) => {
      const status = count > 0 ? '✅' : '❌';
      console.log(`${status} ${table}: ${count} 件`);
    });

    const totalRecords = counts.reduce((sum, { count }) => sum + count, 0);
    console.log(`\n📊 総レコード数: ${totalRecords} 件\n`);

    // 詳細データサンプルを表示
    if (counts[0].count > 0) { // Parentsがあれば
      console.log('👨‍👩‍👧‍👦 保護者データサンプル:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━');
      const parents = await prisma.parent.findMany({
        take: 3,
        include: {
          students: {
            select: { name: true }
          }
        }
      });
      
      parents.forEach((parent, index) => {
        console.log(`${index + 1}. ${parent.name}`);
        console.log(`   📧 Email: ${parent.email}`);
        console.log(`   👶 子供: ${parent.students.map(s => s.name).join(', ') || 'なし'}`);
        console.log(`   📅 登録日: ${parent.createdAt.toLocaleString('ja-JP')}`);
        console.log();
      });
    }

    if (counts[1].count > 0) { // Studentsがあれば
      console.log('🎓 学生データサンプル:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━');
      const students = await prisma.student.findMany({
        take: 3,
        include: {
          parent: {
            select: { name: true }
          },
          pairings: {
            include: {
              tutor: {
                select: { name: true }
              }
            }
          }
        }
      });
      
      students.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name}`);
        console.log(`   📧 Google Email: ${student.googleEmail}`);
        console.log(`   👨‍👩‍👧‍👦 保護者: ${student.parent.name}`);
        console.log(`   🎯 興味分野: ${student.interests.join(', ')}`);
        console.log(`   👨‍🏫 チューター: ${student.pairings.map(p => p.tutor.name).join(', ') || 'なし'}`);
        if (student.cautions) {
          console.log(`   ⚠️  注意事項: ${student.cautions}`);
        }
        console.log();
      });
    }

    if (counts[2].count > 0) { // Tutorsがあれば
      console.log('👨‍🏫 チューターデータサンプル:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━');
      const tutors = await prisma.tutor.findMany({
        take: 3,
        include: {
          pairings: {
            include: {
              student: {
                select: { name: true }
              }
            }
          },
          availabilities: {
            select: { startAt: true, endAt: true },
            orderBy: { startAt: 'desc' },
            take: 1
          }
        }
      });
      
      tutors.forEach((tutor, index) => {
        console.log(`${index + 1}. ${tutor.name}`);
        console.log(`   📧 Google Email: ${tutor.googleEmail}`);
        console.log(`   🏫 所属: ${tutor.affiliation || 'なし'}`);
        console.log(`   🎯 専門分野: ${tutor.specialties.join(', ')}`);
        console.log(`   👨‍🎓 担当学生: ${tutor.pairings.map(p => p.student.name).join(', ') || 'なし'}`);
        if (tutor.availabilities.length > 0) {
          const availability = tutor.availabilities[0];
          console.log(`   ⏰ 最新稼働枠: ${availability.startAt.toLocaleString('ja-JP')} - ${availability.endAt.toLocaleString('ja-JP')}`);
        }
        console.log();
      });
    }

    // リレーションの整合性チェック
    console.log('🔗 リレーション整合性チェック:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    
    // 孤立した学生（親がいない）
    const orphanStudents = await prisma.student.count({
      where: {
        parent: null
      }
    });
    console.log(`❓ 親がいない学生: ${orphanStudents} 件 ${orphanStudents === 0 ? '✅' : '⚠️'}`);
    
    // ペアリングの整合性
    const activePairings = await prisma.pairing.count({
      where: { status: 'ACTIVE' }
    });
    console.log(`🤝 アクティブなペアリング: ${activePairings} 件`);

    console.log('\n🎉 シードデータ確認完了！');
    
    if (totalRecords === 0) {
      console.log('\n💡 データが見つかりません。以下を確認してください:');
      console.log('   1. データベースサーバーが起動しているか');
      console.log('   2. マイグレーションが実行されているか: npx prisma migrate dev');
      console.log('   3. シードデータが実行されているか: npx prisma db seed');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 データベース接続エラーです。以下を確認してください:');
      console.log('   1. DATABASE_URLが正しいか');
      console.log('   2. データベースサーバーが起動しているか');
      console.log('   3. ネットワーク接続に問題がないか');
    } else if (error.code === 'P2021') {
      console.log('\n💡 テーブルが存在しません。以下を実行してください:');
      console.log('   npx prisma migrate dev');
      console.log('   または');
      console.log('   npx prisma db push');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// メイン実行
checkSeedData().catch(console.error);