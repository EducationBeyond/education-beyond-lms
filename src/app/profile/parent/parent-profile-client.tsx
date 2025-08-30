'use client';

import { ProfileForm } from '@/components/profile/profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ParentProfileClientProps {
  initialData: any;
}

export function ParentProfileClient({ initialData }: ParentProfileClientProps) {
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

  return (
    <div className="space-y-6">
      {initialData.students && initialData.students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>お子様一覧</CardTitle>
            <CardDescription>管理されているお子様の情報</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {initialData.students.map((student: any) => (
                <div key={student.id} className="border p-4 rounded-lg">
                  <h4 className="font-semibold">{student.name}</h4>
                  {student.interests && student.interests.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      興味分野: {student.interests.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <ProfileForm
        role="PARENT"
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}