'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/auth';

interface RoleSetupFormProps {
  userEmail: string;
}

interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  {
    value: 'STUDENT',
    label: '生徒',
    description: '学習記録の閲覧、チューター検索・予約ができます',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    value: 'PARENT',
    label: '保護者',
    description: '子供の学習記録閲覧、支払い情報管理ができます',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20a3 3 0 01-3-3v-2a3 3 0 015.356-1.857A3 3 0 017 20zm3-14a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    value: 'TUTOR',
    label: 'チューター',
    description: '稼働枠管理、予約確認・承認、学習記録作成ができます',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export function RoleSetupForm({ userEmail }: RoleSetupFormProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/setup-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        throw new Error('ロールの設定に失敗しました');
      }

      // ページをリフレッシュしてセッションを更新
      router.refresh();
      router.push('/dashboard');
    } catch (error) {
      console.error('Role setup error:', error);
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {roleOptions.map((option) => (
          <div
            key={option.value}
            onClick={() => setSelectedRole(option.value)}
            className={`relative rounded-lg border p-4 cursor-pointer transition-all hover:border-blue-300 ${
              selectedRole === option.value
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${
                selectedRole === option.value ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${
                  selectedRole === option.value ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {option.label}
                </h3>
                <p className={`mt-1 text-sm ${
                  selectedRole === option.value ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {option.description}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedRole === option.value
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedRole === option.value && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!selectedRole || isLoading}
        className="w-full"
      >
        {isLoading ? '設定中...' : '設定を完了する'}
      </Button>
    </div>
  );
}