'use client';

import { useState, useEffect } from 'react';
import { User, Mail, BookOpen, Calendar, ExternalLink, GraduationCap, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  email: string;
  name: string;
  furigana?: string;
  birthdate?: string;
  gender?: string;
  interests: string[];
  cautions?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pairing {
  id: string;
  status: string;
  score?: number;
  startedAt?: string;
  createdAt: string;
  student: Student;
}

const interestMap: Record<string, string> = {
  mathematics: '数学',
  english: '英語',
  science: '理科',
  japanese: '国語',
  social_studies: '社会',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  history: '歴史',
  geography: '地理',
};

export function TutorAssignedStudentsClient() {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignedStudents();
  }, []);

  const fetchAssignedStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tutor/assigned-students');

      if (response.ok) {
        const data = await response.json();
        setPairings(data.pairings || []);
      } else {
        const error = await response.json();
        setError(error.error || '担当参加者の取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch assigned students:', error);
      setError('担当参加者の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!pairings || pairings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            担当参加者
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">まだ担当参加者がいません</p>
          <p className="text-sm text-gray-400">
            マッチングが完了すると、こちらに担当参加者の情報が表示されます
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 概要カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            担当参加者概要
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{pairings.length}</div>
              <div className="text-sm text-gray-600">総担当参加者数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {pairings.filter(p => p.status === 'ACTIVE').length}
              </div>
              <div className="text-sm text-gray-600">アクティブ</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {pairings.filter(p => p.status === 'PENDING').length}
              </div>
              <div className="text-sm text-gray-600">保留中</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 参加者リスト */}
      <div className="grid grid-cols-1 gap-6">
        {pairings.map((pairing) => {
          const student = pairing.student;

          return (
            <Card key={pairing.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    {student.name}
                  </CardTitle>
                  <Badge variant={pairing.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {pairing.status === 'ACTIVE' ? 'アクティブ' : pairing.status}
                  </Badge>
                </div>
                {student.furigana && (
                  <CardDescription>{student.furigana}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 基本情報 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* メールアドレス */}
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">メールアドレス</p>
                        <p className="text-sm text-gray-900">{student.email}</p>
                      </div>
                    </div>

                    {/* 年齢 */}
                    {student.birthdate && (
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">年齢</p>
                          <p className="text-sm text-gray-900">
                            {calculateAge(student.birthdate)}歳
                            {student.gender && ` (${student.gender === 'male' ? '男性' : student.gender === 'female' ? '女性' : 'その他'})`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 興味分野 */}
                  {student.interests && student.interests.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">興味分野</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {student.interests.map((interest, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {interestMap[interest] || interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 注意事項 */}
                  {student.cautions && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-1">注意事項</p>
                      <p className="text-sm text-yellow-700">{student.cautions}</p>
                    </div>
                  )}

                  {/* マッチング情報 */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">マッチング開始</p>
                        <p className="text-gray-900">
                          {pairing.startedAt ?
                            new Date(pairing.startedAt).toLocaleDateString('ja-JP') :
                            new Date(pairing.createdAt).toLocaleDateString('ja-JP')
                          }
                        </p>
                      </div>
                      {pairing.score && (
                        <div>
                          <p className="font-medium text-gray-700">マッチ度</p>
                          <p className="text-gray-900">{Math.round(pairing.score * 100)}%</p>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-700">ペアリングID</p>
                        <p className="text-gray-900 font-mono text-xs">{pairing.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="border-t pt-4">
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        学習記録
                      </Button>
                      <Button size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        詳細
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
