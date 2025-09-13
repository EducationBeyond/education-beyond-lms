'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Link, CheckCircle, ExternalLink } from 'lucide-react';

interface GoogleLinkProps {
  userEmail: string;
  isLinked?: boolean;
}

export function GoogleLink({ userEmail, isLinked = false }: GoogleLinkProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleLink = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Google認証を開始（アカウント選択を強制）
      const result = await signIn('google', {
        redirect: false,
        prompt: 'select_account', // アカウント選択を強制
        callbackUrl: `/auth/callback/google-link?currentEmail=${encodeURIComponent(userEmail)}`,
      });

      if (result?.error) {
        setError('Google認証に失敗しました');
        return;
      }

      // 成功時の処理は callback で行われる
    } catch (error) {
      console.error('Google link error:', error);
      setError('Google連携に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Googleアカウントが連携済みかチェック
  const isGoogleLinked = isLinked || (session?.user?.email && session.user.email.includes('@gmail.com'));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Googleアカウント連携
        </CardTitle>
        <CardDescription>
          Googleアカウントと連携することで、Googleログインが利用できるようになります
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-gray-500">
                  {isGoogleLinked ? session?.user?.email || userEmail : '未連携'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGoogleLinked ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  連携済み
                </Badge>
              ) : (
                <Badge variant="secondary">未連携</Badge>
              )}
            </div>
          </div>

          {!isGoogleLinked && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">連携のメリット</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• ログイン時にGoogleアカウントを選択可能</li>
                  <li>• パスワードを覚える必要がありません</li>
                  <li>• セキュリティが向上します</li>
                </ul>
              </div>

              <Button
                onClick={handleGoogleLink}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    連携中...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Googleアカウントと連携
                    <ExternalLink className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          )}

          {isGoogleLinked && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">連携完了</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                ログイン画面でGoogleアカウントを選択してログインできます
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}