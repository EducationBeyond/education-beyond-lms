const { Client } = require('pg');
require('dotenv').config();

async function testCloudSQLConnection() {
  console.log('🔗 Cloud SQL Proxy接続テストを開始します...');

  // 環境変数の確認
  const requiredVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ 必要な環境変数が設定されていません:', missingVars);
    process.exit(1);
  }

  // Cloud SQL Proxy経由でのDB接続設定
  const client = new Client({
    host: '127.0.0.1', // Cloud SQL Proxyのローカルアドレス
    port: 5432,        // Cloud SQL Proxyのポート
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,        // Cloud SQL Proxyを使用する場合はSSLは不要
  });

  try {
    console.log('📡 データベースに接続しています...');
    await client.connect();
    console.log('✅ データベース接続に成功しました!');

    // 基本的なクエリテスト
    console.log('🔍 基本的なクエリをテストしています...');
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQLバージョン:', result.rows[0].version);

    // テーブル一覧の確認
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length > 0) {
      console.log('📋 存在するテーブル:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('ℹ️  publicスキーマにテーブルが見つかりませんでした（初回セットアップ前の可能性があります）');
    }

    console.log('🎉 Cloud SQL Proxy接続テストが完了しました!');

  } catch (error) {
    console.error('❌ データベース接続エラー:', error.message);
    console.error('💡 確認事項:');
    console.error('  1. Cloud SQL Proxyが起動していることを確認してください');
    console.error('  2. Cloud SQL インスタンスが起動していることを確認してください');
    console.error('  3. 環境変数が正しく設定されていることを確認してください');
    console.error('  4. データベースユーザーの権限が適切であることを確認してください');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Cloud SQL Proxyが起動しているかチェック
async function checkCloudSQLProxy() {
  const net = require('net');

  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(3000);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.connect(5432, '127.0.0.1');
  });
}

async function main() {
  console.log('🚀 Cloud SQL接続チェックを開始します...\n');

  // Cloud SQL Proxyの起動チェック
  console.log('🔍 Cloud SQL Proxyの起動状況をチェックしています...');
  const isProxyRunning = await checkCloudSQLProxy();

  if (!isProxyRunning) {
    console.error('❌ Cloud SQL Proxyがポート5432で起動していません');
    console.error('💡 以下のコマンドでCloud SQL Proxyを起動してください:');
    console.error('   docker-compose up cloud-sql-proxy');
    console.error('   または:');
    console.error('   cloud_sql_proxy -instances=${CLOUD_SQL_CONNECTION_NAME}=tcp:5432');
    process.exit(1);
  }

  console.log('✅ Cloud SQL Proxyが起動しています\n');

  // データベース接続テスト
  await testCloudSQLConnection();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCloudSQLConnection, checkCloudSQLProxy };