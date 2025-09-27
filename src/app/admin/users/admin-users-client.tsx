'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Dialog コンポーネントがないため削除
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Admin用
  email: string | null; // 参加者の場合はnullの可能性
  role: 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN';
  createdAt: string;
  parent?: { firstName: string; lastName: string };
  students?: { firstName: string; lastName: string }[];
  affiliation?: string;
}

const getUserDisplayName = (user: User) => {
  if (user.role === 'ADMIN') {
    return user.name || '名前未設定';
  }
  return user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : '名前未設定';
};

const getParentDisplayName = (parent: { firstName: string; lastName: string }) => {
  return `${parent.firstName} ${parent.lastName}`;
};

const getStudentDisplayName = (student: { firstName: string; lastName: string }) => {
  return `${student.firstName} ${student.lastName}`;
};

export function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredRole, setFilteredRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Googleアカウント紐づけフォーム用の状態
  const [linkingStudentId, setLinkingStudentId] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

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

  // Googleメールアドレス設定処理
  const handleLinkGoogleAccount = async (studentId: string) => {
    if (!linkEmail) return;

    setLinkLoading(true);
    setError(null);
    setLinkSuccess(null);

    try {
      const response = await fetch(`/api/admin/students/${studentId}/link-google`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: linkEmail,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setLinkSuccess(result.message);
        // ユーザーリストを再取得
        await fetchUsers(filteredRole);
        // フォームをリセット
        setTimeout(() => {
          setLinkingStudentId(null);
          setLinkEmail('');
          setLinkSuccess(null);
        }, 2000);
      } else {
        setError(result.error || 'Googleメールアドレスの設定に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLinkLoading(false);
    }
  };

  // フォームを開く処理
  const openLinkForm = (studentId: string) => {
    setLinkingStudentId(studentId);
    setLinkEmail('');
    setError(null);
    setLinkSuccess(null);
  };

  // フォームをキャンセルする処理
  const cancelLinkForm = () => {
    setLinkingStudentId(null);
    setLinkEmail('');
    setError(null);
    setLinkSuccess(null);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'STUDENT': return '参加者';
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
              <SelectItem value="STUDENT">参加者</SelectItem>
              <SelectItem value="STUDENT_UNLINKED">未紐づけ参加者</SelectItem>
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
                  <div className="flex-1">
                    <CardTitle className="text-lg">{getUserDisplayName(user)}</CardTitle>
                    <CardDescription>
                      {user.email || (user.role === 'STUDENT' ? '未設定' : '不明')}
                    </CardDescription>
                    {user.role === 'STUDENT' && (
                      <div className="flex items-center gap-1 mt-1">
                        {user.email ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">Googleアカウント紐づけ済</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-orange-600">Googleアカウント未設定</span>
                          </>
                        )}
                      </div>
                    )}
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
                      {getParentDisplayName(user.parent)}
                    </p>
                  )}

                  {user.role === 'PARENT' && user.students && user.students.length > 0 && (
                    <p>
                      <span className="font-medium">お子様: </span>
                      {user.students.map(s => getStudentDisplayName(s)).join(', ')}
                    </p>
                  )}

                  {user.role === 'TUTOR' && user.affiliation && (
                    <p>
                      <span className="font-medium">所属: </span>
                      {user.affiliation}
                    </p>
                  )}
                </div>

                {/* 参加者でGoogleアカウント未設定の場合のみボタン/フォーム表示 */}
                {user.role === 'STUDENT' && !user.email && (
                  <div className="mt-4 pt-4 border-t">
                    {linkingStudentId === user.id ? (
                      // 紐づけフォーム
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Googleアカウントを紐づける</h4>

                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">{error}</AlertDescription>
                          </Alert>
                        )}

                        {linkSuccess && (
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs text-green-700">{linkSuccess}</AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor={`link-email-${user.id}`} className="text-xs">Googleメールアドレス</Label>
                          <Input
                            id={`link-email-${user.id}`}
                            type="email"
                            placeholder="student@gmail.com"
                            value={linkEmail}
                            onChange={(e) => setLinkEmail(e.target.value)}
                            disabled={linkLoading || !!linkSuccess}
                            className="h-8 text-xs"
                          />
                          <p className="text-xs text-muted-foreground">
                            ※ 参加者本人がこのメールアドレスでGoogle OAuthログインを行います
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleLinkGoogleAccount(user.id)}
                            disabled={linkLoading || !linkEmail || !!linkSuccess}
                            className="flex-1 h-8 text-xs"
                          >
                            {linkLoading ? 'メール設定中...' : 'メールアドレスを設定'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelLinkForm}
                            disabled={linkLoading}
                            className="h-8 text-xs"
                          >
                            キャンセル
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // 紐づけボタン
                      <Button
                        size="sm"
                        onClick={() => openLinkForm(user.id)}
                        className="w-full h-8 text-xs"
                      >
                        <Mail className="h-3 w-3 mr-2" />
                        Googleアカウントを紐づける
                      </Button>
                    )}
                  </div>
                )}
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
            <p className="font-medium">参加者数</p>
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
