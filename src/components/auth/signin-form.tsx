'use client';

import { signIn, getSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormData {
  email: string;
  password: string;
}

type LoginMethod = 'credentials' | 'google';

export function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const message = searchParams?.get('message');
  const authError = searchParams?.get('error'); // NextAuth error parameter

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('credentials');
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NextAuth のエラーパラメータをチェック
  useEffect(() => {
    if (authError) {
      console.log('[SignInForm] NextAuth error detected:', authError);
      switch (authError) {
        case 'Signin':
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
        case 'EmailCreateAccount':
        case 'Callback':
        case 'OAuthAccountNotLinked':
        case 'EmailSignin':
        case 'CredentialsSignin':
        case 'SessionRequired':
          setError('指定されたメールアドレスが見つかりません。管理者にお問い合わせください。');
          setLoginMethod('google'); // Google login tab to show error
          break;
        default:
          setError('ログインでエラーが発生しました。再度お試しください。');
      }
    }
  }, [authError]);

  const handleRoleBasedRedirect = async (email: string) => {
    try {
      console.log(`[SignInForm] Attempting to get role for email: ${email}`);
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const { redirectPath } = await response.json();
        console.log(`[SignInForm] Role API returned redirectPath: ${redirectPath}`);
        console.log(`[SignInForm] About to call router.push(${redirectPath})`);

        // 即座にリダイレクト
        window.location.href = redirectPath;
      } else {
        const errorData = await response.json();
        console.error('[SignInForm] Role detection failed:', errorData);

        if (response.status === 422 && errorData.userExists) {
          // ユーザーは存在するがロールが未割り当て
          console.log('[SignInForm] User exists but role not assigned');
          setError(`アカウント「${errorData.user?.email}」のロールが設定されていません。管理者にお問い合わせください。`);
          setIsLoading(false);
          return;
        } else if (response.status === 404 && !errorData.userExists) {
          // ユーザーが存在しない
          console.log('[SignInForm] User does not exist');
          setError('ログインに失敗しました。アカウントが存在しません。');
          setIsLoading(false);
          return;
        } else {
          // その他のエラー
          console.log('[SignInForm] Other error, falling back to callbackUrl:', callbackUrl);
          window.location.href = callbackUrl;
        }
      }
    } catch (error) {
      console.error('[SignInForm] Role redirect error:', error);
      console.log('[SignInForm] Falling back to callbackUrl:', callbackUrl);
      setError('ログイン処理でエラーが発生しました。');
      setIsLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('[SignInForm] Starting credentials sign in for:', formData.email);
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        callbackUrl,
        redirect: false,
      });

      console.log('[SignInForm] Credentials signIn result:', result);

      if (result?.error) {
        console.error('[SignInForm] Credentials auth error:', result.error);
        setError('メールアドレスまたはパスワードが正しくありません');
      } else if (result?.ok) {
        // 認証成功時はロール別リダイレクト
        console.log('[SignInForm] Credentials auth successful, proceeding to role redirect');
        await handleRoleBasedRedirect(formData.email);
      }
    } catch (error) {
      console.error('[SignInForm] Credentials sign in error:', error);
      setError('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[SignInForm] Starting Google sign in...');
      console.log('[SignInForm] Callback URL:', callbackUrl);

      // Google認証はブラウザリダイレクトで処理
      await signIn('google', {
        callbackUrl: callbackUrl,
      });

      // この時点ではリダイレクトされるため、以下のコードは通常実行されない
      console.log('[SignInForm] signIn completed (should not reach here)');
    } catch (error) {
      console.error('[SignInForm] Google sign in error:', error);
      setError('Googleログインでエラーが発生しました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {message === 'registration-success' && (
        <Alert>
          <AlertDescription>
            アカウントが作成されました。ログインしてください。
          </AlertDescription>
        </Alert>
      )}

      {/* Login Method Toggle */}
      <div className="flex rounded-lg border p-1">
        <Button
          type="button"
          onClick={() => setLoginMethod('credentials')}
          variant={loginMethod === 'credentials' ? 'default' : 'ghost'}
          className="flex-1"
          size="sm"
        >
          メール/パスワード
        </Button>
        <Button
          type="button"
          onClick={() => setLoginMethod('google')}
          variant={loginMethod === 'google' ? 'default' : 'ghost'}
          className="flex-1"
          size="sm"
        >
          Google
        </Button>
      </div>

      {/* Credentials Form */}
      {loginMethod === 'credentials' && (
        <form onSubmit={handleCredentialsSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your-email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="パスワードを入力"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
      )}

      {/* Google Sign In */}
      {loginMethod === 'google' && (
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              ログイン中...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleでログイン
            </span>
          )}
        </Button>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Register Links */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">アカウントをお持ちでない方</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/register/student"
            className="text-blue-600 hover:text-blue-500 text-sm border border-blue-600 hover:border-blue-500 px-4 py-2 rounded-md transition-colors"
          >
            学生登録
          </Link>
          <Link
            href="/register/tutor"
            className="text-green-600 hover:text-green-500 text-sm border border-green-600 hover:border-green-500 px-4 py-2 rounded-md transition-colors"
          >
            チューター登録
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます。
      </div>
    </div>
  );
}