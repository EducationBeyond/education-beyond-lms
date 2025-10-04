# LINE ↔ Slack メッセージ中継機能 セットアップガイド

このドキュメントでは、LINE と Slack 間のメッセージ中継機能のセットアップ方法を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [環境変数の設定](#環境変数の設定)
3. [データベースマイグレーション](#データベースマイグレーション)
4. [LINE Bot の設定](#line-bot-の設定)
5. [Slack App の設定](#slack-app-の設定)
6. [ユーザーIDとチャネルIDの設定](#ユーザーidとチャネルidの設定)
7. [動作確認](#動作確認)
8. [トラブルシューティング](#トラブルシューティング)

## 前提条件

- LINE Developers アカウント
- Slack Workspace の管理者権限
- PostgreSQL データベース
- Next.js アプリケーションの実行環境

## 環境変数の設定

`.env.local` に以下の環境変数を追加してください:

```bash
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Slack API
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your_slack_signing_secret
```

### 取得方法

#### LINE

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. Provider を作成 / 選択
3. Messaging API チャネルを作成
4. チャネル基本設定から以下を取得:
   - `Channel secret` → `LINE_CHANNEL_SECRET`
5. Messaging API 設定から以下を取得:
   - `Channel access token (long-lived)` を発行 → `LINE_CHANNEL_ACCESS_TOKEN`

#### Slack

1. [Slack API](https://api.slack.com/apps) にアクセス
2. "Create New App" → "From scratch" を選択
3. App 名と Workspace を設定
4. OAuth & Permissions から以下のスコープを追加:
   - `chat:write`
   - `channels:read`
   - `groups:read`
   - `users:read`
   - `files:write`
5. "Install to Workspace" でアプリをインストール
6. `Bot User OAuth Token` を取得 → `SLACK_BOT_TOKEN`
7. Basic Information から `Signing Secret` を取得 → `SLACK_SIGNING_SECRET`

## データベースマイグレーション

以下のコマンドでスキーマを更新します:

```bash
# Prisma スキーマを生成
npx prisma generate

# マイグレーションを作成
npx prisma migrate dev --name add_messaging_relay

# マイグレーションを適用
npx prisma migrate deploy
```

追加されるカラム:
- **Student テーブル**: `line_user_id` - LINEユーザーID（ユニーク）
- **Tutor テーブル**: `slack_user_id` - SlackユーザーID（ユニーク）
- **Pairing テーブル**: `line_group_id` - LINEグループID（ユニーク）、`slack_channel_id` - SlackチャネルID（ユニーク）

## LINE Bot の設定

### Webhook URL の設定

1. LINE Developers Console で Messaging API チャネルを開く
2. Messaging API 設定タブを選択
3. Webhook URL に以下を設定:
   ```
   https://your-domain.com/api/webhooks/line
   ```
4. "Webhook の利用" を ON にする
5. "検証" ボタンで接続確認

### Webhook イベントの有効化

以下のイベントを有効にします:
- メッセージ (message)
- メッセージイベント (message.text, message.image)

## Slack App の設定

### Event Subscriptions の設定

1. Slack App の設定画面で "Event Subscriptions" を開く
2. "Enable Events" を ON にする
3. Request URL に以下を設定:
   ```
   https://your-domain.com/api/webhooks/slack
   ```
4. "Subscribe to bot events" で以下のイベントを追加:
   - `message.channels`
   - `message.groups`

### Bot を Slack チャネルに追加

中継対象のチャネルに Bot を招待します:
```
/invite @your-bot-name
```

## ユーザーIDとチャネルIDの設定

メッセージ中継を機能させるには、以下の情報を設定する必要があります:

### 1. Student に LINE User ID を設定

```sql
UPDATE students
SET line_user_id = 'U1234567890'
WHERE id = 'student_id';
```

**LINE User ID の取得方法:**
1. LINE Bot を対象のグループに追加
2. 生徒がグループでメッセージを送信
3. サーバーログで `userId` を確認

### 2. Tutor に Slack User ID を設定

```sql
UPDATE tutors
SET slack_user_id = 'U9876543210'
WHERE id = 'tutor_id';
```

**Slack User ID の取得方法:**
1. Slack でユーザーのプロフィールを開く
2. 「その他」→「メンバーIDをコピー」

または、以下のコマンドで取得:
```bash
curl -X GET https://slack.com/api/users.list \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN"
```

### 3. Pairing に LINE グループ ID と Slack チャネル ID を設定

```sql
UPDATE pairings
SET
  line_group_id = 'C1234567890',
  slack_channel_id = 'C9876543210',
  updated_at = NOW()
WHERE student_id = 'student_id' AND tutor_id = 'tutor_id';
```

**LINE グループ ID の取得方法:**
1. LINE Bot を対象のグループに追加
2. グループでメッセージを送信
3. サーバーログで `groupId` を確認

**Slack チャネル ID の取得方法:**
1. Slack でチャネルを開く
2. チャネル名をクリック
3. 下部に表示される「チャネル ID」をコピー

### API を使用した設定（実装例）

```typescript
import { updatePairingChannels } from '@/lib/messaging/relay-service';

// Pairingにチャネル情報を設定
await updatePairingChannels(
  'pairing_id',
  'C1234567890', // LINE グループID
  'C9876543210'  // Slack チャネルID
);
```

## 動作確認

### LINE → Slack

1. LINE グループでメッセージを送信
2. Slack チャネルに同じメッセージが表示されることを確認
3. 送信者名が正しく表示されることを確認

### Slack → LINE

1. Slack チャネルでメッセージを送信
2. LINE グループに同じメッセージが表示されることを確認
3. 送信者名が正しく表示されることを確認

### ログの確認

```bash
# サーバーログで中継状況を確認
[RelayService] Successfully relayed LINE → Slack: message_id
[RelayService] Successfully relayed Slack → LINE: message_ts
```

## トラブルシューティング

### メッセージが中継されない

1. **Webhook が届いているか確認**
   ```bash
   # ログで確認
   [LINE Webhook] Received webhook request
   [Slack Webhook] Received webhook request
   ```

2. **署名検証が成功しているか確認**
   - 環境変数が正しく設定されているか確認
   - LINE_CHANNEL_SECRET と SLACK_SIGNING_SECRET を再確認

3. **ユーザーIDが設定されているか確認**
   ```sql
   -- StudentのLINE User IDを確認
   SELECT id, first_name, last_name, line_user_id
   FROM students
   WHERE line_user_id IS NOT NULL;

   -- TutorのSlack User IDを確認
   SELECT id, first_name, last_name, slack_user_id
   FROM tutors
   WHERE slack_user_id IS NOT NULL;
   ```

4. **Pairingのチャネル情報が設定されているか確認**
   ```sql
   SELECT id, student_id, tutor_id, line_group_id, slack_channel_id, status
   FROM pairings
   WHERE status = 'ACTIVE' AND deleted_at IS NULL;
   ```

5. **サーバーログでエラー内容を確認**
   ```bash
   [RelayService] Student not found for LINE user: ...
   [RelayService] Tutor not found for Slack user: ...
   [RelayService] No active pairing found for ...
   ```

## セキュリティ考慮事項

1. **署名検証の有効化**: 全ての Webhook で署名検証を実施
2. **HTTPS の使用**: Webhook URL は HTTPS を使用
3. **アクセス制限**: Webhook エンドポイントには外部からのアクセスのみ許可
4. **ログの監視**: 不正なアクセスや異常なパターンを監視
5. **トークンの保護**: 環境変数を安全に管理

## パフォーマンス最適化

1. **非同期処理**: Webhook レスポンスは即座に返し、処理は非同期で実行
2. **レート制限対応**: API 制限に達しないよう制御
3. **キャッシュ**: Student/Tutor 情報をキャッシュして DB アクセスを削減
4. **ログ最適化**: メッセージ履歴はDBに保存せず、必要に応じて外部ロギングサービスを使用

## 関連ファイル

- `prisma/schema.prisma`: データベーススキーマ
- `src/lib/messaging/line-client.ts`: LINE API クライアント
- `src/lib/messaging/slack-client.ts`: Slack API クライアント
- `src/lib/messaging/relay-service.ts`: メッセージ中継サービス
- `src/app/api/webhooks/line/route.ts`: LINE Webhook エンドポイント
- `src/app/api/webhooks/slack/route.ts`: Slack Events API エンドポイント
