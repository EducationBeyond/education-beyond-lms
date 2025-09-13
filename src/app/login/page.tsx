import { Suspense } from 'react';
import { SignInForm } from '@/components/auth/signin-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">
              Education Beyond LMS
            </CardTitle>
            <CardDescription className="text-center">
              ログインしてください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center">Loading...</div>}>
              <SignInForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}