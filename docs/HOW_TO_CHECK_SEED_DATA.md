# シードデータの確認方法

データベースにシードデータが正しく格納されているかを確認する方法をいくつか紹介します。

## 1. Prisma Studio を使用した確認（推奨）

### 起動方法
```bash
npx prisma studio
```

**特徴:**
- 🎨 視覚的なデータブラウザ
- ✏️ データの編集・削除・追加が可能
- 🔍 リレーション関係も確認できる
- 🌐 ブラウザで http://localhost:5555 にアクセス

### 確認手順
1. Prisma Studioを起動
2. 左側のテーブル一覧から確認したいテーブルをクリック
3. データが表示されることを確認

## 2. Prisma Client を使用したプログラム確認

### データ確認スクリプトの作成
```javascript
// check-seed-data.js
const { PrismaClient } = require('@prisma/client');

async function checkSeedData() {
  const prisma = new PrismaClient();
  
  try {
    // 親データの確認
    const parents = await prisma.parent.findMany({
      include: { students: true }
    });
    console.log(`👨‍👩‍👧‍👦 Parents: ${parents.length}件`);
    
    // 学生データの確認
    const students = await prisma.student.findMany({
      include: { parent: true, pairings: true }
    });
    console.log(`🎓 Students: ${students.length}件`);
    
    // チューターデータの確認
    const tutors = await prisma.tutor.findMany({
      include: { pairings: true, availabilities: true }
    });
    console.log(`👨‍🏫 Tutors: ${tutors.length}件`);
    
    // 学習記録の確認
    const records = await prisma.learningRecord.findMany({
      include: { student: true, tutor: true }
    });
    console.log(`📚 Learning Records: ${records.length}件`);
    
  } finally {
    await prisma.$disconnect();
  }
}

checkSeedData();
```

### 実行方法
```bash
node check-seed-data.js
```

## 3. 直接SQLクエリを使用した確認

### テーブル一覧の確認
```javascript
const tables = await prisma.$queryRaw`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
  ORDER BY table_name;
`;
console.log(tables);
```

### レコード数の確認
```javascript
const parentCount = await prisma.$queryRaw`
  SELECT COUNT(*) as count FROM parents;
`;
console.log('Parents:', parentCount[0].count);
```

## 4. Next.js API Route を使用した確認

### API Route の作成
```typescript
// src/app/api/check-seed/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [parentCount, studentCount, tutorCount] = await Promise.all([
      prisma.parent.count(),
      prisma.student.count(),
      prisma.tutor.count(),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        parents: parentCount,
        students: studentCount,
        tutors: tutorCount,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### API確認方法
```bash
curl http://localhost:3000/api/check-seed
# または
npm run dev
# ブラウザで http://localhost:3000/api/check-seed にアクセス
```

## 5. シードデータの再実行

### シードスクリプトの実行
```bash
npx prisma db seed
```

### package.jsonにシード設定を追加
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## 6. 本格的な運用環境での確認方法

### Supabase Dashboard
1. Supabaseプロジェクトの管理画面にログイン
2. 「Table Editor」セクションでテーブル一覧を確認
3. 各テーブルをクリックしてデータを表示

### Database Client（pgAdmin, DBeaver等）
1. データベース接続情報を設定
2. SQLクエリを実行してデータ確認
3. テーブル構造とインデックスも確認可能

## トラブルシューティング

### データが空の場合
1. マイグレーションが実行されているか確認
   ```bash
   npx prisma migrate status
   ```

2. シードが実行されているか確認
   ```bash
   npx prisma db seed
   ```

3. 接続先データベースが正しいか確認
   ```bash
   echo $DATABASE_URL
   ```

### よくあるエラー
- **P1001**: データベースサーバーに接続できない
  → DATABASE_URLとサーバー起動状況を確認
  
- **P2002**: 重複データエラー
  → シードデータの重複実行。テーブルをクリアしてから再実行

- **P2025**: レコードが見つからない
  → 外部キー制約の問題。親データが存在するか確認

## まとめ

最も効率的な確認方法：

1. **開発中**: Prisma Studio（視覚的で使いやすい）
2. **自動テスト**: Prisma Clientスクリプト
3. **本番確認**: Supabase Dashboard or Database Client
4. **API統合確認**: Next.js API Route

各方法を使い分けることで、データベースの状態を効率的に確認できます。