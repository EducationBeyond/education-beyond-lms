import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            新規アカウント作成
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Education Beyond LMSに登録してください
          </p>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterForm />
        </Suspense>

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            既にアカウントをお持ちの方はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}