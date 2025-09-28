# Cloud SQL Proxy セットアップガイド

このガイドでは、Google Cloud SQL for PostgreSQLにCloud SQL Proxyを使用して接続する方法を説明します。

## 前提条件

1. Google Cloud SQLインスタンスが作成済みであること
2. サービスアカウントキーが取得済みであること
3. Docker および Docker Compose がインストールされていること

## セットアップ手順

### 1. サービスアカウントキーの配置

Google Cloudコンソールで作成したサービスアカウントキー（JSON形式）を、プロジェクトのルートディレクトリに `gcp-service-account.json` として配置してください。

```bash
# プロジェクトルート
education-beyond-lms/
├── gcp-service-account.json  # ← このファイルを配置
├── docker-compose.yml
└── ...
```

**⚠️ セキュリティ注意事項:**
- `gcp-service-account.json` は既に `.gitignore` に追加されています
- 本番環境では、サービスアカウントキーの代わりにWorkload Identityの使用を推奨します

### 2. 環境変数の設定

`.env` ファイルに以下の環境変数を設定してください：

```bash
# Cloud SQL 設定
CLOUD_SQL_CONNECTION_NAME="your-project-id:your-region:your-instance-name"
DB_USER="your-db-username"
DB_PASSWORD="your-db-password"
DB_NAME="education_beyond_lms"

# Prisma用データベースURL（Cloud SQL Proxy経由）
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?schema=public&connection_limit=5"
DIRECT_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?schema=public"
```

### 3. Cloud SQL Proxyの起動

#### Docker Compose を使用する場合

```bash
# Cloud SQL Proxy のみ起動
docker-compose up cloud-sql-proxy

# アプリケーションと一緒に起動
docker-compose up
```

#### 直接Cloud SQL Proxyを起動する場合

```bash
# Cloud SQL Proxyをダウンロード（macOS）
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud_sql_proxy

# 起動
./cloud_sql_proxy -instances=${CLOUD_SQL_CONNECTION_NAME}=tcp:5432 -credential_file=./gcp-service-account.json
```

### 4. 接続テスト

```bash
# 接続テストスクリプトの実行
npm run db:test-connection

# または直接実行
node scripts/test-cloud-sql-connection.js
```

### 5. Prismaマイグレーション

Cloud SQL Proxyが起動している状態で、Prismaのマイグレーションを実行します：

```bash
# Prismaクライアントの生成
npm run db:generate

# マイグレーション実行
npm run db:migrate

# シードデータの投入
npm run db:seed
```

## トラブルシューティング

### 接続エラーが発生する場合

1. **Cloud SQL Proxyが起動しているか確認**
   ```bash
   # ポート5432が使用されているか確認
   lsof -i :5432
   ```

2. **Cloud SQLインスタンスの状態確認**
   ```bash
   # Google Cloud CLI使用
   gcloud sql instances describe your-instance-name
   ```

3. **サービスアカウントの権限確認**
   - Cloud SQL Client ロールが付与されていることを確認
   - Cloud SQL Editor ロール（必要に応じて）

4. **ファイアウォール設定の確認**
   - Cloud SQLインスタンスの承認済みネットワークの設定
   - プライベートIPを使用している場合はVPCピアリングの設定

### よくあるエラー

#### エラー: "connection refused"
- Cloud SQL Proxyが起動していない可能性
- 接続名（CONNECTION_NAME）が間違っている可能性

#### エラー: "authentication failed"
- データベースのユーザー名/パスワードが間違っている可能性
- サービスアカウントの権限が不足している可能性

#### エラー: "database does not exist"
- データベース名が間違っている可能性
- データベースが作成されていない可能性

## 本番環境での運用

### Workload Identity を使用する場合

本番環境では、サービスアカウントキーファイルの代わりにWorkload Identityを使用することを推奨します：

```yaml
# docker-compose.prod.yml
services:
  cloud-sql-proxy:
    image: gcr.io/cloudsql-docker/gce-proxy:1.36.0
    command: /cloud_sql_proxy -instances=${CLOUD_SQL_CONNECTION_NAME}=tcp:0.0.0.0:5432
    # credential_file の指定を削除
```

### Cloud Run での使用

Cloud Runでは、Cloud SQL Proxyのサイドカーパターンまたは、Cloud SQLの直接接続を使用できます：

```yaml
# Cloud Run での設定例
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  annotations:
    run.googleapis.com/cloudsql-instances: your-project-id:your-region:your-instance-name
```

## パフォーマンス最適化

1. **接続プールの設定**
   ```
   DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/db?schema=public&connection_limit=10&pool_timeout=20"
   ```

2. **Cloud SQL Proxyの設定**
   ```bash
   # 複数インスタンスの場合
   cloud_sql_proxy -instances=instance1=tcp:5432,instance2=tcp:5433
   ```

3. **Prismaクエリの最適化**
   - 適切なインデックスの設定
   - N+1問題の回避
   - バッチクエリの使用

## セキュリティ考慮事項

1. **ネットワークセキュリティ**
   - プライベートIPの使用を推奨
   - 必要最小限の接続のみ許可

2. **認証・認可**
   - IAMデータベース認証の使用
   - 最小権限の原則

3. **暗号化**
   - 保存時暗号化の有効化
   - 転送時暗号化（TLS）

## 監視とロギング

1. **Cloud SQL Insights の活用**
2. **接続プールの監視**
3. **クエリパフォーマンスの監視**

## 参考リンク

- [Cloud SQL Proxy 公式ドキュメント](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Prisma with Cloud SQL](https://www.prisma.io/docs/guides/deployment/deploying-to-google-cloud-run)
- [Cloud SQL セキュリティベストプラクティス](https://cloud.google.com/sql/docs/postgres/security)