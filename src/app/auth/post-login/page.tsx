'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function PostLoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      return; // まだセッション読み込み中
    }

    if (!session?.user?.email) {
      console.log('[PostLogin] No session or email, redirecting to login');
      router.push('/login');
      return;
    }

    const handleRoleBasedRedirect = async () => {
      try {
        console.log('[PostLogin] Getting role for:', session.user?.email);

        const response = await fetch('/api/user/role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: session.user?.email }),
        });

        if (response.ok) {
          const { redirectPath } = await response.json();
          console.log('[PostLogin] Redirecting to:', redirectPath);
          window.location.href = redirectPath;
        } else {
          const errorData = await response.json();
          console.error('[PostLogin] Role detection failed:', errorData);

          if (response.status === 422 && errorData.userExists) {
            // ユーザーは存在するがロールが未割り当て
            setError(`アカウント「${session.user?.email}」のロールが設定されていません。管理者にお問い合わせください。`);
          } else {
            setError('アカウントの確認に失敗しました。管理者にお問い合わせください。');
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[PostLogin] Error:', error);
        setError('ログイン処理でエラーが発生しました。');
        setIsLoading(false);
      }
    };

    handleRoleBasedRedirect();
  }, [session, status, router, callbackUrl]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-sm text-muted-foreground">ログイン処理中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">ログインエラー</h1>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                下記の方法でお試しください：
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>管理者にロール設定を依頼する</li>
                <li>正しいアカウントでログインし直す</li>
                <li>しばらく時間を置いてから再度お試しください</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-2">
              <Button asChild variant="outline">
                <Link href="/login">ログイン画面に戻る</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">ホームに戻る</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PostLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PostLoginContent />
    </Suspense>
  );
}