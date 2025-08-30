import { Suspense } from 'react';
import { RoleSetupForm } from '@/components/auth/role-setup-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SetupRolePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // 既にロールが設定済みの場合はホームにリダイレクト
  if (session.user.role) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            ロール設定
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            あなたの役割を選択してください
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                初回ログインです
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                システムを利用するために、あなたのロール（役割）を設定してください。
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <RoleSetupForm userEmail={session.user.email!} />
        </Suspense>
      </div>
    </div>
  );
}