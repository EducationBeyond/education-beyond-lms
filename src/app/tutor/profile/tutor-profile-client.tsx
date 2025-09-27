'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ProfileForm } from '@/components/profile/profile-form';
import { ImageUpload } from '@/components/profile/image-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TutorProfileClientProps {
  initialData: any;
}

export function TutorProfileClient({ initialData }: TutorProfileClientProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl);

  const handleImageUpload = async (imageUrl: string) => {
    setAvatarUrl(imageUrl);

    // 画像アップロード後に自動的にプロフィールを保存
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...initialData,
          avatarUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('プロフィール自動保存エラー:', error);
      } else {
        console.log('[Profile] Avatar URL automatically saved to database');
      }
    } catch (error) {
      console.error('プロフィール自動保存エラー:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    // 画像URLを含める
    data.avatarUrl = avatarUrl;
    // payoutInfoがあればbankAccountInfoに変換（後方互換性のため）
    if (data.payoutInfo && !data.bankAccountInfo) {
      data.bankAccountInfo = data.payoutInfo;
      delete data.payoutInfo;
    }
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

  return (
    <div className="space-y-6">
      <ImageUpload
        currentImageUrl={avatarUrl}
        onImageUpload={handleImageUpload}
      />

      <ProfileForm
        role="TUTOR"
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
