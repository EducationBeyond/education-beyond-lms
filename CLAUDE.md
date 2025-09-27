# CLAUDE.md — Education Beyond LMS（AI駆動開発ガイド）

> 本ドキュメントは **Claude** を用いたAI駆動開発（AID: AI-Driven Development）を円滑に進めるための「作業指示書」です。Claude への System / Developer / User 指示テンプレ、開発プロセス、データ仕様、外部連携、品質基準、セキュリティ方針を一か所に集約します。

---

## 0. プロジェクト概要
- **サービス名**: Education Beyond（LMS）
- **背景**: 現状は Slack / Notion / Google Form / HubSpot / Spreadsheet / GAS / マネーフォワード など多ツール運用で、可視性低下・運用負荷増大。
- **目的**
  - 使用サービスの絞り込みによる **業務フローの単純化と自動化**
  - **データの一元管理** による所在不明問題の解消
  - **オリジナルLMS** による多様なオペレーションニーズへの柔軟対応
- **主要ロール**: 生徒 / 保護者 / チューター / 管理者
- **主要連携**: Google（認証, Meet, Calendar, Drive）, HubSpot, マネーフォワード, LINE, Slack

---

## 1. Claude への基本指示（System Prompt）
Claude をエンジニア/PM/アーキテクトとして機能させるための共通 System 指示です。必要に応じて **会話の最初に貼り付け** てください。

```
あなたは Education Beyond LMS の AI アーキテクト/ペアプロエンジニア/テックライターです。
原則:
1) 事実/要件に忠実。2) 曖昧さは仮説→明示。3) 設計→実装→検証を小さく反復。
4) セキュリティ/プライバシー/可観測性/運用を常に考慮。5) 変更容易性(モジュール性)最優先。
出力様式:
- まず結論、その後根拠/代替案/トレードオフ。
- コードは実行可能最小例(最低限の依存・README付)。
- 仕様は表/箇条書き/シーケンス図で簡潔に。
- すべて日本語。英語用語は必要に応じ併記。
制約:
- 個人情報(PII)・機微情報の取扱いは法令/社内基準に従う。
- 最新API仕様が不確かな場合は、明確に断り、スタブを提示する。
```

---

## 2. Claude 用テンプレート（Developer/User Prompt）

### 2.1 課題分解テンプレ
```
# ゴール
<今回の成果物: 例) Student検索APIのスキーマとテスト>

# 入力
- 既存仕様: <抜粋 or リンク>
- 制約: <性能/セキュリティ/期限など>

# 期待する出力
- 要件の箇条書き整理
- ドメインモデル/ERの更新案
- API契約(型, バリデーション)
- 実装方針(疑似コード)
- リスク/論点/代替案
```

### 2.2 設計レビュー依頼テンプレ
```
以下の設計のレビューを依頼: <設計本文>
観点: 正当性/一貫性/拡張性/セキュリティ/可観測性/テスト容易性
出力: 改善提案リスト(優先度付き) + 影響範囲 + 修正後サンプル
```

### 2.3 コード生成テンプレ
```
目的: <例: Tutor検索REST APIの実装(Next.js API routes + Prisma)>
前提: DBスキーマは <貼付> を使用。入力バリデーションは zod。
出力: 実行可能なコード + 最小の単体テスト + OpenAPI定義 + README。
```

### 2.4 テスト駆動テンプレ
```
機能: <例: Google Calendar連携による空き枠予約>
前提: 外部APIはスタブ化。ユースケースを Given/When/Then で3~5件提示。
出力: 失敗するテスト → 実装 → リファクタの順で。
```

### 2.5 仕様差分と移行テンプレ
```
変更点: <例: ParentにLINE連携フィールド追加>
出力: 1) 影響範囲 2) マイグレーション手順 3) ロールバック手順 4) モニタリング項目
```

---

## 3. ドメインモデル / データ構造

### 3.1 エンティティ（最小核）
| Entity | 主キー | 主な属性 | 関連 |
|---|---|---|---|
| Student | student_id | google_email, name, parent_id, birthdate, gender, interests[], cautions | Parent(多:1), LearningRecord(1:多), Match(多:多 via Pairing), Reservation(1:多) |
| Parent | parent_id | email, name, address | Student(1:多), LINEAccount(1:1) |
| Tutor | tutor_id | google_email, name, address, affiliation, specialties[], avatar_url, payout_info | LearningRecord(1:多), Availability(1:多), Reservation(1:多) |
| Admin | admin_id | google_email, name | — |
| LearningRecord | record_id | student_id, tutor_id, date, summary, materials[], duration_min, score?, tags[] | Student, Tutor |
| Reservation | reservation_id | student_id, tutor_id, start_at, end_at, channel(Meet/Onsite), status | CalendarEvent(1:1) |
| CalendarEvent | event_id | provider(Google), external_id, join_url | Reservation |
| DriveFile | file_id | provider(Google), external_id, mime, owner_id, scope(Student/Tutor/Admin) | LearningRecord(多:多) |
| Payment | payment_id | provider(MF), external_id, payer(Parent), amount, currency, status, received_at | Parent |
| CRMContact | contact_id | provider(HubSpot), external_id, role(Parent/Student/Tutor), email | 各User |
| Pairing | pairing_id | student_id, tutor_id, status(active/pending/ended), score(match度) | Student, Tutor |
| Availability | availability_id | tutor_id, start_at, end_at, recurrence? | Tutor |
| MessageLink | message_id | provider(LINE/Slack), external_id, channel_url | Tutor/Parent |

> **注意**: PIIは最小保持。第三者提供なし。外部IDは `provider:external_id` で一意に。

### 3.2 スキーマ（例: PostgreSQL このままDDL化可能な要約）
- 文字列は原則 `text`、メールは `citext`、配列は `text[]`、日時は `timestamptz`。
- 監査: 全テーブルに `created_at`, `updated_at`, `created_by`, `updated_by`。
- 論理削除: 必要箇所に `deleted_at`。

---

## 4. 主要ユースケース & シーケンス

### 4.1 参加者→チューター検索
1) Student が条件（専門分野/時間帯）で検索
2) Tutor.Availability と Pairing 状態から候補提示
3) スコアリング: specialties × interests, 実績, 評価
4) 予約導線へ（Calendar 空き枠連動）

### 4.2 予約/面談（Google Calendar / Meet）
- Student が希望枠を選択 → Reservation 作成（pending）
- Google Calendar API で双方に tentative イベント作成 → Meetリンク付与
- Tutor 承認で status=confirmed
- 直前リマインド（メール/LINE）

### 4.3 学習記録
- レッスン後 Tutor が LearningRecord を作成（サマリ、教材、課題）
- Drive ファイル添付、Parent/Student 閲覧可視性制御
- 経時で Student ダッシュボードに推移表示

### 4.4 決済/入金（マネーフォワード）
- 請求発行→入金Webhook受領→Payment 突合
- Parent 単位でステータス集計、督促/自動通知

---

## 5. 外部連携（最小構成と権限）
| サービス | 用途 | 推奨権限/スコープ | 備考 |
|---|---|---|---|
| Google OAuth | ログイン | `openid email profile` | Organization 制約, ドメイン許可
| Google Calendar | 予約 | `https://www.googleapis.com/auth/calendar.events` | 共有カレンダー/サービスアカウント方式を検討
| Google Meet | 面談 | Calendar 経由で生成 | 直接APIはCalendar連携依存
| Google Drive | 学習資料 | `.../drive.file`（最小） | アプリ作成ファイル限定権限
| HubSpot | CRM同期 | contacts, engagements（最小） | 二重管理回避: ソース・オブ・トゥルースを定義
| マネーフォワード | 入金検知 | Webhook + 取引照会（最小） | 科目/タグ運用ルールを明記
| LINE | 保護者連絡 | Messaging API（push最小） | 同意取得と配信ポリシー
| Slack | チューター連絡 | bot:chat:write (最小) | チーム運用と個別DM区別

> **方針**: 「最小スコープ」「オフボード容易」「手動代替手段の確保（フェイルセーフ）」

---

## 6. API 契約（例）

### 6.1 REST（/api）
- `GET /students?interest=math&limit=20` → 参加者一覧（匿名化可）
- `POST /reservations` → 予約作成 `{student_id, tutor_id, start_at, end_at}`
- `PATCH /reservations/:id/confirm` → チューター承認
- `POST /learning-records` → 記録作成
- `POST /payments/webhook` → MF入金Webhook（署名検証）

### 6.2 バリデーション（zod 例）
- Email: RFC準拠 + ドメイン許可
- Datetime: ISO 8601, `start_at < end_at`
- 権限制御: ABAC（role + ownership + pairing）

### 6.3 OpenAPI / スキーマ駆動
- `openapi.yaml` を単一ソースに。コード・SDK・モックを自動生成。

---

## 7. 非機能要件
- **セキュリティ**: OAuth/OIDC、JWT短命化、BFFパターン、CSP/CSRF/Rate Limit、監査ログ
- **プライバシー**: 目的外利用禁止、保持期間、削除要請、同意管理（LINE/メール）
- **可用性**: 99.9%目標、主要連携のリトライ/バックオフ、キューワーカー
- **可観測性**: 分散トレーシング（trace id）、構造化ログ、主要KPIダッシュボード
- **パフォーマンス**: P95 API < 300ms（キャッシュ前提外）

---

## 8. データ保護 & コンプライアンス
- **対象データ**: 未成年者を含む個人情報（生徒/保護者）
- **準拠**: 個人情報保護法（APPI）, 学校/塾のガイドライン, プライバシーポリシー整備
- **運用**: アクセス最小権限、侵害時手順（72h報告目安）、暗号化(At-Rest/Transit)
- **ログ**: 個人特定不可な形を優先。PIIはハッシュ/トークン化。

---

## 9. Claude オペレーションワークフロー

### 9.1 Issue 駆動サイクル
1) **Issue作成**: ユースケース単位で「目的/完了条件/制約」を明記
2) **Claude設計支援**: 2章テンプレで仕様化
3) **コード生成**: スケルトンとテストを生成
4) **自己レビュー**: Claudeにレビューチェックリストを実施させる
5) **結合/回帰**: 自動テスト/モック外部連携で検証
6) **ドキュ更新**: ER/シーケンス図/OpenAPIを再生成

### 9.2 レビューチェックリスト（Claude に実行させる）
- 入力検証は十分か？
- 認可は ABAC で過不足ないか？
- 外部APIの失敗/遅延時の挙動は？
- ログにPIIが漏れないか？
- ロールバック手順は明確か？

---

## 10. 受け入れ基準（サンプル）
- 参加者は **興味分野** と **曜日/時間** でチューター候補を3件以上取得できる
- 予約確定時に双方へカレンダーイベント + Meetリンクが付与される
- 学習記録は Student/Parent で閲覧可、他者からは閲覧不可
- 入金がMFで検知されると 10分以内 に Payment ステータスが反映

---

## 11. Claude への具体的プロンプト例

### 例A: Tutor検索のランキングロジック
```
目的: Tutorランキング(スコア)の実装設計
入力: Student.interests[], Tutor.specialties[], 過去LearningRecordの満足度(0-5)
制約: 計算はPostgreSQL上で完結できると望ましい
出力: スコア式(根拠) + SQL例 + テストケース(3件)
```

### 例B: Google Calendar 連携の堅牢化
```
目的: 予約→確定の二相コミット風ワークフロー
入力: 現仕様(草案) <貼付>
出力: シーケンス図 + 失敗時補償トランザクションの擬似コード
```

### 例C: MF Webhook 検証
```
目的: Webhook署名検証と冪等性キー設計
出力: 署名検証手順 + リプレイ攻撃対策 + e2eテスト
```

---

## 12. UI/UX ガイド（最小）
- ロールごとにホームを分離（Student/Parent/Tutor/Admin）
- 重要指標カード: ユーザー数/学習回数/マッチ率/入金状況
- 予約は **空き枠カレンダー**（週表示）をデフォルト
- アクセシビリティ: キーボード操作、色覚多様性

---

## 13. 技術スタック（推奨例・暫定）
- フロント: Next.js + TypeScript + tRPC/REST + zod
- BFF/API: Next.js API Routes or FastAPI（Python）
- DB: PostgreSQL + Prisma/SQLAlchemy（どちらか統一）
- 認証: Google OAuth（NextAuth など）
- メッセージング/ジョブ: Cloud Tasks / PubSub / BullMQ（選択）
- IaC: Terraform
- 監視: OpenTelemetry + Grafana/Datadog（選択）

> 既存資産/チームスキルにより調整可。Claude に「モノリス優先→段階的分割」方針で相談。

---

## 14. データ移行 / 同期ポリシー
- 既存ツールからの移行は **段階的**（read-only → 双方向 → 完全移行）
- 外部IDマッピングテーブルを維持（HubSpot/Google/MF/LINE/Slack）
- 二重更新を避けるため **単一の編集元** を定める

---

## 15. セキュリティ実装チェック（抜粋）
- OAuthリダイレクト固定、PKCE、state検証
- Webhook: 署名+タイムスタンプ+冪等性キー（idempotency_key）
- RBAC+ABAC（role + 所有権 + pairing 状態）
- 監査ログ: `who did what when`（変更差分）
- バックアップ/鍵管理（KMS, .envの分離）

---

## 16. KPI / 計測
- マッチ率（Student↔Tutor）
- 予約成立率 / キャンセル率
- 学習継続率（週次/月次）
- 入金消込リードタイム
- サポート応答SLA（LINE/Slack）

---

## 17. サンプル ER 図（テキスト）
```
Parent 1—* Student *—* Pairing *—* Tutor 1—* Availability
Student 1—* Reservation *—1 CalendarEvent
Tutor 1—* LearningRecord *—1 Student
LearningRecord *—* DriveFile
Parent 1—* Payment
User(共通) — CRMContact/MessageLink(連携)
```

---

## 18. 用語集
- **Pairing**: 生徒とチューターの紐付け状態（pending/active/ended）
- **Availability**: チューター稼働可能枠
- **LearningRecord**: 授業サマリ/教材/評価等の記録

---

## 19. 変更管理
- すべての仕様変更は Issue と PR に紐付け
- Claude に **変更差分の要約** と **移行手順** を自動生成させる

---

## 20. 付録：DDL スタブ（抜粋）
```sql
create table parents (
  parent_id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  name text not null,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table students (
  student_id uuid primary key default gen_random_uuid(),
  google_email citext not null unique,
  name text not null,
  parent_id uuid references parents(parent_id),
  birthdate date,
  gender text check (gender in ('male','female','other') ),
  interests text[],
  cautions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

### 最後に
このファイルを「単一の真実の源泉（SSOT）」として運用し、Claude との対話に常時添付/引用して開発します。更新のたびに **目的・制約・受け入れ基準** を明記し、迷いを減らしましょう。
