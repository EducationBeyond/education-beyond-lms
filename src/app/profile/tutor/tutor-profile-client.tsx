'use client';

import { useState } from 'react';
import { ProfileForm } from '@/components/profile/profile-form';
import { ImageUpload } from '@/components/profile/image-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TutorProfileClientProps {
  initialData: any;
}

export function TutorProfileClient({ initialData }: TutorProfileClientProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl);

  const handleImageUpload = (imageUrl: string) => {
    setAvatarUrl(imageUrl);
  };

  const handleSubmit = async (data: any) => {
    // 画像URLを含める
    data.avatarUrl = avatarUrl;
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      <div className="space-y-6">
        {initialData.pairings && initialData.pairings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>担当学生</CardTitle>
              <CardDescription>現在指導中の学生一覧</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {initialData.pairings.map((pairing: any) => (
                  <div key={pairing.id} className="border p-3 rounded-lg">
                    <h4 className="font-semibold">{pairing.student.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      ペアリングID: {pairing.id}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>稼働可能時間</CardTitle>
            <CardDescription>設定された稼働可能時間帯</CardDescription>
          </CardHeader>
          <CardContent>
            {initialData.availabilities && initialData.availabilities.length > 0 ? (
              <div className="space-y-2">
                {initialData.availabilities.map((availability: any) => (
                  <div key={availability.id} className="text-sm">
                    {new Date(availability.startAt).toLocaleString('ja-JP')} - 
                    {new Date(availability.endAt).toLocaleString('ja-JP')}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">稼働可能時間が設定されていません</p>
            )}
          </CardContent>
        </Card>

        {avatarUrl && (
          <Card>
            <CardHeader>
              <CardTitle>現在のプロフィール画像</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={avatarUrl} 
                alt="プロフィール画像"
                className="w-32 h-32 rounded-full object-cover mx-auto"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}