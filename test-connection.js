// データベース接続テスト
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔗 データベース接続テスト開始...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('📊 データベースURL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    
    // 接続テスト
    console.log('🔌 データベースに接続中...');
    await prisma.$connect();
    console.log('✅ 接続成功！');

    // 基本的なクエリテスト
    console.log('🧪 基本クエリテスト中...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ クエリ実行成功:', result);

    // テーブル存在確認
    console.log('📋 テーブル一覧取得中...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      console.log('✅ テーブル一覧:', tables);
      
      if (tables.length === 0) {
        console.log('⚠️  テーブルが見つかりません。');
        console.log('💡 以下のコマンドを実行してください:');
        console.log('   npm run db:push');
        console.log('   または');
        console.log('   npm run db:migrate');
      }
    } catch (error) {
      console.log('❌ テーブル取得エラー:', error.message);
    }

    console.log('\n🎉 データベース接続テスト完了！');

  } catch (error) {
    console.error('❌ 接続エラー:', error.message);
    console.error('📝 エラーコード:', error.code);
    
    console.log('\n💡 解決方法:');
    if (error.code === 'P1001') {
      console.log('   1. データベースサーバーが起動しているか確認');
      console.log('   2. DATABASE_URLが正しいか確認');
      console.log('   3. ネットワーク接続を確認');
    } else if (error.code === 'P1017') {
      console.log('   1. データベースサーバーのバージョンを確認');
      console.log('   2. Prismaクライアントを更新');
    } else {
      console.log('   1. .envファイルのDATABASE_URLを確認');
      console.log('   2. データベース権限を確認');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().catch(console.error);