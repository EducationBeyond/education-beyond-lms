'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

type UnassignedUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  createdAt: Date;
  emailVerified: Date | null;
};

type Parent = {
  id: string;
  name: string;
  email: string;
};

type RoleAssignmentData = {
  role: 'student' | 'parent' | 'tutor' | 'admin';
  name: string;
  furigana?: string;
  address?: string;
  parentId?: string; // student用
  birthdate?: string; // student用
  gender?: 'MALE' | 'FEMALE' | 'OTHER'; // student用
  giftedTraits?: string[]; // student用
  interests?: string[]; // student用
  cautions?: string; // student用
  affiliation?: string; // tutor用
  specialties?: string[]; // tutor用
  adminRole?: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR'; // admin用
};

interface UnassignedUsersClientProps {
  unassignedUsers: UnassignedUser[];
  parents: Parent[];
}

export function UnassignedUsersClient({ unassignedUsers: initialUsers, parents }: UnassignedUsersClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<UnassignedUser | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [roleData, setRoleData] = useState<RoleAssignmentData>({
    role: 'student',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssignRole = (user: UnassignedUser) => {
    setSelectedUser(user);
    setRoleData({
      role: 'student',
      name: user.name || '',
    });
    setError(null);
    setShowDialog(true);
  };

  const handleSubmitRole = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: roleData.role,
          roleData: roleData,
        }),
      });

      if (response.ok) {
        // ユーザー一覧から削除
        setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
        setShowDialog(false);
        setSelectedUser(null);

        // ページを更新して最新の状態を取得
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'ロール割り当てに失敗しました');
      }
    } catch (error) {
      console.error('Role assignment error:', error);
      setError('ロール割り当て処理でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setRoleData(prev => ({
      role: role as RoleAssignmentData['role'],
      name: prev.name,
      // ロール変更時に他のフィールドはリセット
    }));
  };

  const renderRoleFields = () => {
    switch (roleData.role) {
      case 'student':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="furigana">ふりがな</Label>
                <Input
                  id="furigana"
                  value={roleData.furigana || ''}
                  onChange={(e) => setRoleData(prev => ({ ...prev, furigana: e.target.value }))}
                  placeholder="やまだ たろう"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">保護者 *</Label>
                <Select
                  value={roleData.parentId || ''}
                  onValueChange={(value) => setRoleData(prev => ({ ...prev, parentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="保護者を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.name} ({parent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthdate">生年月日</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={roleData.birthdate || ''}
                  onChange={(e) => setRoleData(prev => ({ ...prev, birthdate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">性別</Label>
                <Select
                  value={roleData.gender || ''}
                  onValueChange={(value) => setRoleData(prev => ({
                    ...prev,
                    gender: value as 'MALE' | 'FEMALE' | 'OTHER'
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="性別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">男性</SelectItem>
                    <SelectItem value="FEMALE">女性</SelectItem>
                    <SelectItem value="OTHER">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">興味・関心分野</Label>
              <Input
                id="interests"
                value={roleData.interests?.join(', ') || ''}
                onChange={(e) => setRoleData(prev => ({
                  ...prev,
                  interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                placeholder="数学, 科学, プログラミング"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cautions">配慮事項</Label>
              <Textarea
                id="cautions"
                value={roleData.cautions || ''}
                onChange={(e) => setRoleData(prev => ({ ...prev, cautions: e.target.value }))}
                placeholder="アレルギーや特別な配慮が必要な事項"
              />
            </div>
          </>
        );

      case 'parent':
        return null; // 親は名前のみで十分

      case 'tutor':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="furigana">ふりがな</Label>
              <Input
                id="furigana"
                value={roleData.furigana || ''}
                onChange={(e) => setRoleData(prev => ({ ...prev, furigana: e.target.value }))}
                placeholder="やまだ たろう"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliation">所属</Label>
              <Input
                id="affiliation"
                value={roleData.affiliation || ''}
                onChange={(e) => setRoleData(prev => ({ ...prev, affiliation: e.target.value }))}
                placeholder="大学名、会社名など"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">専門分野</Label>
              <Input
                id="specialties"
                value={roleData.specialties?.join(', ') || ''}
                onChange={(e) => setRoleData(prev => ({
                  ...prev,
                  specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                placeholder="数学, 物理, プログラミング"
              />
            </div>
          </>
        );

      case 'admin':
        return (
          <div className="space-y-2">
            <Label htmlFor="adminRole">管理者権限</Label>
            <Select
              value={roleData.adminRole || 'ADMIN'}
              onValueChange={(value) => setRoleData(prev => ({
                ...prev,
                adminRole: value as 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR'
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MODERATOR">モデレーター</SelectItem>
                <SelectItem value="ADMIN">管理者</SelectItem>
                <SelectItem value="SUPER_ADMIN">スーパー管理者</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
    }
  };

  return (
    <>
      <div className="space-y-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">
                ロール未割り当てのユーザーはいません。
              </p>
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={user.image || ''} alt={user.name || ''} />
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{user.name || 'No name'}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        登録: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                      </Badge>
                      {user.emailVerified && (
                        <Badge variant="default" className="text-xs">
                          メール認証済み
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button onClick={() => handleAssignRole(user)}>
                  ロール割り当て
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>ロール割り当て</DialogTitle>
            <DialogDescription>
              {selectedUser?.name || selectedUser?.email} にロールを割り当てます。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">ロール *</Label>
              <Select value={roleData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="parent">保護者</SelectItem>
                  <SelectItem value="tutor">チューター</SelectItem>
                  <SelectItem value="admin">管理者</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">名前 *</Label>
              <Input
                id="name"
                value={roleData.name}
                onChange={(e) => setRoleData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="山田太郎"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                value={roleData.address || ''}
                onChange={(e) => setRoleData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="東京都渋谷区..."
              />
            </div>

            {renderRoleFields()}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSubmitRole}
              disabled={isLoading || !roleData.name}
            >
              {isLoading ? '割り当て中...' : 'ロールを割り当て'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}