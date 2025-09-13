'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN';
  createdAt: string;
  parent?: { name: string };
  students?: { name: string }[];
  affiliation?: string;
}

export function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredRole, setFilteredRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (role: string = 'all') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users?role=${role}`);
      
      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      const data = await response.json();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(filteredRole);
  }, [filteredRole]);

  const getRoleName = (role: string) => {
    switch (role) {
      case 'STUDENT': return '学生';
      case 'PARENT': return '保護者';
      case 'TUTOR': return 'チューター';
      case 'ADMIN': return '管理者';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT': return 'bg-blue-100 text-blue-800';
      case 'PARENT': return 'bg-green-100 text-green-800';
      case 'TUTOR': return 'bg-purple-100 text-purple-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Select value={filteredRole} onValueChange={setFilteredRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="ロールで絞り込み" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのユーザー</SelectItem>
              <SelectItem value="STUDENT">学生</SelectItem>
              <SelectItem value="PARENT">保護者</SelectItem>
              <SelectItem value="TUTOR">チューター</SelectItem>
              <SelectItem value="ADMIN">管理者</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => fetchUsers(filteredRole)}>
          更新
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p>読み込み中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleName(user.role)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">作成日: </span>
                    {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                  
                  {user.role === 'STUDENT' && user.parent && (
                    <p>
                      <span className="font-medium">保護者: </span>
                      {user.parent.name}
                    </p>
                  )}
                  
                  {user.role === 'PARENT' && user.students && user.students.length > 0 && (
                    <p>
                      <span className="font-medium">お子様: </span>
                      {user.students.map(s => s.name).join(', ')}
                    </p>
                  )}
                  
                  {user.role === 'TUTOR' && user.affiliation && (
                    <p>
                      <span className="font-medium">所属: </span>
                      {user.affiliation}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">ユーザーが見つかりませんでした。</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">統計情報</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium">総ユーザー数</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div>
            <p className="font-medium">学生数</p>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'STUDENT').length}
            </p>
          </div>
          <div>
            <p className="font-medium">保護者数</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.role === 'PARENT').length}
            </p>
          </div>
          <div>
            <p className="font-medium">チューター数</p>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === 'TUTOR').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}