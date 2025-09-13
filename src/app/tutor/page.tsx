'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TutorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('[TutorPage] useEffect triggered - status:', status, 'session:', session);
    
    if (status === 'loading') {
      console.log('[TutorPage] Still loading, waiting...');
      return;
    }
    
    if (!session?.user) {
      console.log('[TutorPage] No session found, redirecting to login');
      console.log('[TutorPage] Session object:', session);
      router.push('/login?callbackUrl=%2Ftutor');
      return;
    }

    console.log('[TutorPage] Valid session found:', session);
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">チューターダッシュボード</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-lg text-gray-600">チューター専用ページです。</p>
          <p className="mt-2 text-sm text-gray-500">
            このページはチューターでログインした場合にのみアクセスできます。
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm">ログイン中: {session.user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}