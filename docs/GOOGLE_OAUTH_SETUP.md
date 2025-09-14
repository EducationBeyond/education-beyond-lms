# Google OAuth設定ガイド

## 概要

Education Beyond LMSでGoogleログインを有効化するために必要な設定手順です。

## 1. Google Cloud Console での設定

### Step 1: Google Cloud Consoleにアクセス
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Googleアカウントでログイン

### Step 2: プロジェクトの作成または選択
1. 左上のプロジェクト名をクリック
2. 「新しいプロジェクト」をクリックまたは既存のプロジェクトを選択
3. プロジェクト名: `education-beyond-lms`（推奨）

### Step 3: OAuth同意画面の設定
1. 左側メニューから「APIとサービス」→「OAuth同意画面」
2. User Type: `外部` を選択（内部は Google Workspace ドメインのみ）
3. 「作成」をクリック

#### アプリ情報の入力
- **アプリ名**: `Education Beyond LMS`
- **ユーザーサポートメール**: 管理者のメールアドレス
- **デベロッパーの連絡先情報**: 管理者のメールアドレス

#### スコープの設定
- デフォルトのスコープで問題なし（email, profile, openid）

#### テストユーザー（開発段階）
- 開発・テスト段階では利用予定のGoogleアカウントを追加

### Step 4: 認証情報の作成
1. 左側メニューから「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth 2.0 クライアント ID」
3. アプリケーションの種類: `ウェブアプリケーション`

#### 設定項目
- **名前**: `Education Beyond LMS Web Client`
- **承認済みのJavaScript生成元**:
  - `http://localhost:3000` （開発環境）
  - `https://your-domain.com` （本番環境）
- **承認済みのリダイレクトURI** ⚠️ 重要:
  - `http://localhost:3000/api/auth/callback/google` （開発環境）
  - `https://your-domain.com/api/auth/callback/google` （本番環境）

> **注意**: リダイレクトURIは完全に一致する必要があります。末尾のスラッシュやhttps/httpの違いも区別されます。

### Step 5: クライアントIDとシークレットの取得
1. 作成されたOAuth 2.0クライアントをクリック
2. **クライアント ID** と **クライアント シークレット** をメモ

## 2. 環境変数の設定

`.env` ファイルを更新：

```bash
# Google OAuth
GOOGLE_CLIENT_ID="取得したクライアントID"
GOOGLE_CLIENT_SECRET="取得したクライアントシークレット"

# NextAuth v5
AUTH_SECRET="your-secure-random-string-change-this"
NEXTAUTH_URL="http://localhost:3000"  # 本番環境では実際のドメイン
```

### AUTH_SECRET の生成
ターミナルで以下のコマンドを実行してランダムな文字列を生成：

```bash
openssl rand -base64 32
```

## 3. 本番環境での設定

### ドメインの設定
本番環境では以下を正しく設定：

1. **承認済みドメイン** (OAuth同意画面):
   - `your-domain.com`

2. **リダイレクトURI** (認証情報):
   - `https://your-domain.com/api/auth/callback/google`

3. **環境変数**:
   ```bash
   NEXTAUTH_URL="https://your-domain.com"
   ```

## 4. 公開設定（本番環境のみ）

開発・テスト完了後、一般公開する場合：

1. OAuth同意画面で「アプリを公開」
2. Google の審査が必要な場合がある（機密スコープを使用する場合）

## 5. トラブルシューティング

### よくあるエラー

#### "OAuth client not found"
- クライアントIDが正しく設定されているか確認
- 環境変数が正しく読み込まれているか確認

#### "redirect_uri_mismatch"
- Google Cloud Console の承認済みリダイレクトURIと実際のURIが一致しているか確認
- 本番環境では HTTPS が必要
- 正確なURI: `http://localhost:3000/api/auth/callback/google`

#### "access_denied"
- OAuth同意画面の設定が完了しているか確認
- テストユーザーとして追加されているか確認（公開前）

#### Googleログインボタンを押しても反応しない
- ブラウザの開発者ツールでネットワークタブを確認
- `/api/auth/signin/google` へのリクエストが送信されているか確認
- リダイレクトURIがGoogle Cloud Consoleで正しく設定されているか確認

### デバッグ方法

1. ブラウザの開発者ツールでコンソールエラーを確認
2. NextAuth のデバッグを有効化（既に設定済み）：
   ```bash
   npm run dev
   ```
3. ネットワークタブでOAuth関連のリクエスト/レスポンスを確認

## 6. セキュリティ考慮事項

1. **クライアントシークレット**は絶対に公開しない
2. **承認済みドメイン**は必要最小限に設定
3. **AUTH_SECRET**は本番環境では強力なランダム文字列を使用
4. 定期的に認証情報をローテーション

## 現在の実装状況

✅ NextAuth設定完了
✅ Googleプロバイダー設定完了
✅ ログインフォーム実装完了
❌ Google OAuth環境変数設定（要設定）

## 次のステップ

1. 上記手順でGoogle Cloud Console設定
2. `.env`ファイルに正しいクライアントID/シークレット設定
3. 開発サーバー再起動
4. Googleログイン機能のテスト