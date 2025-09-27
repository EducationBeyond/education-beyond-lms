# LINE ↔ Slack メッセージング機能 設定ガイド

## 概要
Education Beyond LMSでは、学生（LINE）とチューター（Slack）間のメッセージングシステムを提供します。

**フロー**:
- 学生 → LINE → LMS → チューター → Slack
- チューター → Slack → LMS → 学生 → LINE

## アーキテクチャ

### データベーススキーマ
- **Message**: メッセージ履歴
- **ExternalAccount**: LINE/Slack アカウント連携情報
- **Pairing**: 学生とチューターのペアリング管理

### コンポーネント
- `src/lib/line-client.ts`: LINE Bot SDK
- `src/lib/slack-client.ts`: Slack Bot SDK
- `src/lib/messaging-service.ts`: メッセージング中央管理
- `src/app/api/webhooks/line/route.ts`: LINE Webhook
- `src/app/api/webhooks/slack/route.ts`: Slack Webhook

## 設定手順

### 1. 環境変数設定

```bash
# LINE Bot 設定
LINE_CHANNEL_ACCESS_TOKEN="your-line-channel-access-token"
LINE_CHANNEL_SECRET="your-line-channel-secret"

# Slack Bot 設定
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
```

### 2. LINE Bot 設定

#### 2.1 LINE Developers コンソール
1. [LINE Developers](https://developers.line.biz/) でボットを作成
2. **Channel Access Token** を取得
3. **Channel Secret** を取得
4. **Webhook URL** を設定: `https://your-domain.com/api/webhooks/line`

#### 2.2 権限設定
- **Messaging API**: 有効
- **Bot info**: 公開設定
- **Response settings**: Bot auto-reply: 無効

### 3. Slack App 設定

#### 3.1 Slack API
1. [Slack API](https://api.slack.com/apps) でアプリを作成
2. **Bot User OAuth Token** を取得
3. **Event Subscriptions** を有効化
4. **Request URL**: `https://your-domain.com/api/webhooks/slack`

#### 3.2 Bot Token Scopes
以下のスコープを追加:
```
chat:write
users:read
conversations:read
conversations:open
im:write
```

#### 3.3 Event Subscriptions
以下のイベントを購読:
```
message.channels
message.im
app_mention
```

### 4. データベースマイグレーション

新しいスキーマをマイグレーション:
```bash
npx prisma db push
```

## 使用方法

### 1. 外部アカウント連携の登録

学生とチューターが最初にシステムを使用する前に、以下のデータを `ExternalAccount` テーブルに登録する必要があります:

```sql
-- 学生のLINE連携
INSERT INTO external_accounts (user_id, user_type, provider, external_id, is_active)
VALUES ('student-uuid', 'STUDENT', 'LINE', 'line-user-id', true);

-- チューターのSlack連携
INSERT INTO external_accounts (user_id, user_type, provider, external_id, is_active)
VALUES ('tutor-uuid', 'TUTOR', 'SLACK', 'slack-user-id', true);
```

### 2. ペアリング設定

学生とチューターのペアリングを作成:
```sql
INSERT INTO pairings (student_id, tutor_id, status, started_at)
VALUES ('student-uuid', 'tutor-uuid', 'ACTIVE', NOW());
```

### 3. メッセージングフロー

#### 学生からチューターへ
1. 学生がLINEでメッセージを送信
2. LMSが受信してペアリング情報を確認
3. チューターのSlackにメッセージを転送
4. メッセージ履歴をDBに保存

#### チューターから学生へ
1. チューターがSlackでメッセージを送信（スレッド返信推奨）
2. LMSが受信してペアリング情報を確認
3. 学生のLINEにメッセージを転送
4. メッセージ履歴をDBに保存

## API エンドポイント

### Webhook エンドポイント
- **LINE**: `POST /api/webhooks/line`
- **Slack**: `POST /api/webhooks/slack`

### 主要関数
```typescript
// メッセージ送信
sendMessageFromStudent(lineUserId, message)
sendMessageFromTutor(slackUserId, message, messageId, threadId)

// メッセージ履歴取得
getMessageHistory(pairingId, limit, offset)

// チャンネル作成
createTutorMessagingChannel(tutorId, studentId)
```

## トラブルシューティング

### よくある問題

#### 1. メッセージが届かない
- ExternalAccount テーブルでアカウント連携を確認
- Pairing テーブルでアクティブなペアリングを確認
- LINE/Slack の API トークンを確認

#### 2. 署名検証エラー
- LINE_CHANNEL_SECRET の設定を確認
- Webhook URL が正しく設定されているか確認

#### 3. 権限エラー
- Slack Bot の OAuth スコープを確認
- LINE Bot の権限設定を確認

### ログ確認
```bash
# サーバーログでメッセージング関連のログを確認
grep -i "messaging\|line\|slack" logs/app.log
```

## セキュリティ考慮事項

1. **署名検証**: LINE/Slack からのリクエストの署名を検証
2. **アクセス制御**: ExternalAccount による認証制御
3. **データ暗号化**: メッセージ内容の暗号化（必要に応じて）
4. **監査ログ**: メッセージ履歴の完全な記録

## 今後の拡張

- 画像・ファイル添付対応
- グループメッセージング
- メッセージ検索機能
- 既読状況の管理
- Push通知の最適化

## 参考リンク

- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [Slack API](https://api.slack.com/)
- [Prisma Documentation](https://www.prisma.io/docs)