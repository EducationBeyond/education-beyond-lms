'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

function GoogleLinkCallbackContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const currentEmail = searchParams.get('currentEmail');

  useEffect(() => {
    if (status === 'loading') return;

    const processGoogleLink = async () => {
      if (!session?.user?.email || !currentEmail) {
        setResult({
          success: false,
          message: 'セッション情報が不足しています。'
        });
        setProcessing(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/link-google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            googleEmail: session.user.email,
            currentEmail: currentEmail,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setResult({
            success: true,
            message: 'Googleアカウントの連携が完了しました。次回からGoogleログインが利用できます。'
          });
          
          // 3秒後にプロフィールページにリダイレクト
          setTimeout(() => {
            router.push('/student/profile');
          }, 3000);
        } else {
          setResult({
            success: false,
            message: data.error || 'Googleアカウント連携に失敗しました。'
          });
        }
      } catch (error) {
        console.error('Google link callback error:', error);
        setResult({
          success: false,
          message: 'Googleアカウント連携中にエラーが発生しました。'
        });
      } finally {
        setProcessing(false);
      }
    };

    processGoogleLink();
  }, [session, status, currentEmail, router]);

  const handleBackToProfile = () => {
    router.push('/student/profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Googleアカウント連携</CardTitle>
            <CardDescription>
              {processing ? 
                'アカウント連携を処理しています...' : 
                'アカウント連携の結果'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {processing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  Googleアカウント連携を処理中です...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  この処理には少し時間がかかる場合があります
                </p>
              </div>
            ) : result ? (
              <div className="text-center py-4">
                {result.success ? (
                  <>
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <Alert className="mb-4">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {result.message}
                      </AlertDescription>
                    </Alert>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>連携されたGoogleアカウント:</p>
                      <p className="font-mono bg-gray-100 p-2 rounded">
                        {session?.user?.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-4">
                        3秒後に自動的にプロフィールページに移動します
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {result.message}
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleBackToProfile}
                      className="w-full mt-4"
                      variant="outline"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      プロフィールページに戻る
                    </Button>
                  </>
                )}
              </div>
            ) : null}

            {!processing && (
              <div className="text-center">
                <Button
                  onClick={handleBackToProfile}
                  variant="outline"
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  プロフィールページに戻る
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GoogleLinkCallbackPage() {
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
      <GoogleLinkCallbackContent />
    </Suspense>
  );
}