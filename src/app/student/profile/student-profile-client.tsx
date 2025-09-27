'use client';

import { useState } from 'react';
import { ProfileForm } from '@/components/profile/profile-form';
import { GoogleLink } from '@/components/auth/google-link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StudentProfileClientProps {
  initialData: any;
}

export function StudentProfileClient({ initialData }: StudentProfileClientProps) {
  const handleStudentSubmit = async (data: any) => {
    const response = await fetch('/api/profile/student', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '参加者プロフィールの更新に失敗しました');
    }

    window.location.reload();
  };

  const handleParentSubmit = async (data: any) => {
    const response = await fetch('/api/profile/parent', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '保護者プロフィールの更新に失敗しました');
    }

    window.location.reload();
  };

  const formattedStudentData = {
    ...initialData,
    birthdate: initialData.birthdate
      ? new Date(initialData.birthdate).toISOString().split('T')[0]
      : '',
  };

  const formattedParentData = {
    ...initialData.parent,
  };

  // Googleアカウント連携状況をチェック
  const isGoogleLinked = initialData.email && initialData.email.includes('@');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">参加者情報</TabsTrigger>
            <TabsTrigger value="parent">保護者情報</TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="space-y-6">
            <ProfileForm
              role="STUDENT"
              initialData={formattedStudentData}
              onSubmit={handleStudentSubmit}
            />
          </TabsContent>

          <TabsContent value="parent" className="space-y-6">
            <ProfileForm
              role="PARENT"
              initialData={formattedParentData}
              onSubmit={handleParentSubmit}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-6">
        <GoogleLink
          userEmail={initialData.email}
          isLinked={isGoogleLinked}
        />
      </div>
    </div>
  );
}