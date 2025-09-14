# データベースセットアップガイド

Education Beyond LMSのデータベース環境を正しくセットアップするための完全ガイドです。

## 🚀 クイックスタート（推奨手順）

### 1. データベースの準備
```bash
# Supabaseプロジェクトを使用する場合
# 1. https://supabase.com でプロジェクト作成
# 2. DATABASE_URLを.envに設定

# または、ローカルPostgreSQLを使用する場合
# 1. PostgreSQLをインストール
# 2. データベース作成: createdb education_beyond_lms
```

### 2. 環境変数の設定
```bash
# .envファイルを編集
DATABASE_URL="postgresql://username:password@localhost:5432/education_beyond_lms"

# Supabaseの場合
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
```

### 3. データベーススキーマの適用
```bash
# Prismaクライアント生成
npm run db:generate

# スキーマをデータベースにプッシュ（開発環境）
npm run db:push

# または、マイグレーションを実行（本番環境推奨）
npm run db:migrate
```

### 4. シードデータの投入
```bash
# サンプルデータを投入
npm run db:seed

# データの確認
npm run db:check
```

### 5. データベースの確認
```bash
# Prisma Studioでデータを視覚的に確認
npm run db:studio
```

## 📋 利用可能なコマンド一覧

### 基本コマンド
| コマンド | 説明 |
|---------|------|
| `npm run db:generate` | Prismaクライアントを生成 |
| `npm run db:push` | スキーマをDBに直接プッシュ（開発用） |
| `npm run db:migrate` | マイグレーション実行（本番推奨） |
| `npm run db:seed` | シードデータを投入 |
| `npm run db:check` | データ確認スクリプト実行 |
| `npm run db:studio` | Prisma Studio起動 |
| `npm run db:format` | Prismaスキーマフォーマット |

### マイグレーション管理
| コマンド | 説明 |
|---------|------|
| `npm run db:migrate:reset` | DB完全リセット + マイグレーション |
| `npm run db:migrate:deploy` | 本番環境用マイグレーション適用 |

## 🔄 開発ワークフロー

### 新規開発開始時
```bash
# 1. リポジトリクローン後
npm install

# 2. 環境変数設定
cp .env.example .env
# .envファイルを編集してDATABASE_URLを設定

# 3. データベース初期化
npm run db:generate
npm run db:push
npm run db:seed

# 4. 動作確認
npm run db:check
npm run db:studio
```

### スキーマ変更時
```bash
# 1. prisma/schema.prismaを編集

# 2. フォーマット
npm run db:format

# 3. 開発環境にプッシュ
npm run db:push

# 4. クライアント再生成
npm run db:generate

# 5. 必要に応じてシード再実行
npm run db:seed

# 6. 動作確認
npm run db:check
```

### 本番デプロイ時
```bash
# 1. マイグレーション作成
npm run db:migrate

# 2. 本番環境にデプロイ
npm run db:migrate:deploy

# 3. シードデータ投入（初回のみ）
npm run db:seed
```

## 🐛 トラブルシューティング

### よくあるエラーと解決方法

#### 1. `P1001: Can't reach database server`
**原因**: データベースサーバーに接続できない

**解決方法**:
```bash
# DATABASE_URLを確認
echo $DATABASE_URL

# Supabaseの場合、プロジェクトが起動しているか確認
# ローカルPostgreSQLの場合
brew services start postgresql
# または
sudo systemctl start postgresql
```

#### 2. `P2021: The table does not exist`
**原因**: テーブルが作成されていない

**解決方法**:
```bash
# スキーマをプッシュ
npm run db:push

# またはマイグレーション実行
npm run db:migrate
```

#### 3. `P2002: Unique constraint failed`
**原因**: シードデータの重複実行

**解決方法**:
```bash
# データベースリセット
npm run db:migrate:reset

# 再度シード実行
npm run db:seed
```

#### 4. `Prisma Client not generated`
**原因**: Prismaクライアントが生成されていない

**解決方法**:
```bash
# クライアント生成
npm run db:generate
```

## 🏗️ 本番環境での推奨設定

### Supabase
1. Supabaseプロジェクト作成
2. DATABASE_URLを環境変数に設定
3. Row Level Security (RLS) 設定
4. バックアップ設定

```sql
-- RLSの有効化（例）
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
```

### セキュリティ設定
```bash
# 本番環境では必ず設定
NODE_ENV=production

# データベースユーザーは最小権限に
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```

## 📊 データベース監視

### パフォーマンス確認
```sql
-- インデックス使用状況
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('parents', 'students', 'tutors');

-- スロークエリ確認
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

### バックアップ
```bash
# データベース全体バックアップ
pg_dump $DATABASE_URL > backup.sql

# 特定テーブルのみ
pg_dump $DATABASE_URL -t parents -t students > user_data.sql
```

## 🔧 開発Tips

### データのリセット方法
```bash
# 完全リセット（危険！本番では実行しない）
npm run db:migrate:reset

# 特定テーブルのデータのみクリア
npx prisma db execute --stdin <<< "TRUNCATE TABLE parents, students CASCADE;"
```

### テストデータ作成
```typescript
// test-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
  // 大量のテストデータ作成
  const parents = await prisma.parent.createMany({
    data: Array.from({ length: 100 }, (_, i) => ({
      email: `test${i}@example.com`,
      name: `テストユーザー${i}`,
    }))
  });
}
```

### パフォーマンス最適化
```typescript
// バッチ処理
await prisma.$transaction([
  prisma.parent.create({ data: parentData }),
  prisma.student.create({ data: studentData }),
]);

// 一括挿入
await prisma.parent.createMany({
  data: parentsData,
  skipDuplicates: true,
});
```

このガイドに従って、データベース環境を正しくセットアップし、運用してください。