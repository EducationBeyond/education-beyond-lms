'use client';

import { useState } from 'react';
import { ProfileForm } from '@/components/profile/profile-form';

interface StudentProfileClientProps {
  initialData: any;
}

export function StudentProfileClient({ initialData }: StudentProfileClientProps) {
  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'プロフィールの更新に失敗しました');
    }

    // Optimistic UI update can be implemented here
    window.location.reload();
  };

  const formattedData = {
    ...initialData,
    birthdate: initialData.birthdate 
      ? new Date(initialData.birthdate).toISOString().split('T')[0] 
      : '',
  };

  return (
    <div className="space-y-6">
      {initialData.parent && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold">保護者情報</h3>
          <p className="text-muted-foreground">
            保護者: {initialData.parent.name}
          </p>
        </div>
      )}
      
      <ProfileForm
        role="STUDENT"
        initialData={formattedData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}