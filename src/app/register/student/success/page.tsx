import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, User, Clock } from 'lucide-react';

export default function StudentRegistrationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            アカウント登録完了！
          </CardTitle>
          <p className="text-gray-600">
            保護者と学生のアカウントが正常に作成されました
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 完了したこと */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              完了したこと
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  保護者アカウントの作成
                </li>
                <li className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  学生プロフィールの作成
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  保護者と学生の自動紐づけ
                </li>
              </ul>
            </div>
          </div>

          {/* 次のステップ */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              次のステップ
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">学生のGoogleアカウント設定</p>
                    <p className="text-sm text-blue-700">
                      運営チームが学生用のGoogleアカウントを作成し、メールアドレスとパスワードを設定いたします。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">ログイン情報のご連絡</p>
                    <p className="text-sm text-blue-700">
                      学生用のログイン情報を保護者の方にメールでお送りします。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">チューターとのマッチング</p>
                    <p className="text-sm text-blue-700">
                      学生の興味・関心やギフテッド特性に基づいて、最適なチューターをご紹介します。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* お問い合わせ */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-500" />
              ご不明な点がございましたら
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                アカウント作成や今後の流れについてご質問がございましたら、
                お気軽に運営チームまでお問い合わせください。
              </p>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button asChild className="flex-1">
              <Link href="/login">
                保護者アカウントでログイン
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                ホームページに戻る
              </Link>
            </Button>
          </div>

          {/* 注意書き */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t">
            <p>
              学生のGoogleアカウントの設定完了まで、通常1-2営業日程度お時間をいただきます。<br />
              設定完了次第、保護者の方にメールでご連絡いたします。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}