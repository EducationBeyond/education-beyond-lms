'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  email: string;
  name: string;
  furigana?: string;
  interests: string[];
  parent: { id: string; name: string };
  _count: { pairings: number };
}

interface Tutor {
  id: string;
  email: string;
  name: string;
  furigana?: string;
  affiliation?: string;
  specialties: string[];
  avatarUrl?: string;
  _count: { pairings: number };
}

interface Pairing {
  id: string;
  status: string;
  score?: number;
  startedAt?: string;
  student: { id: string; name: string; email: string };
  tutor: { id: string; name: string; email: string };
  createdAt: string;
}

const specialtyMap: Record<string, string> = {
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

export function AdminMatchingClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTutor, setSelectedTutor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, tutorsRes, pairingsRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/tutors'),
        fetch('/api/admin/pairings'),
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students);
      }

      if (tutorsRes.ok) {
        const tutorsData = await tutorsRes.json();
        setTutors(tutorsData.tutors);
      }

      if (pairingsRes.ok) {
        const pairingsData = await pairingsRes.json();
        setPairings(pairingsData.pairings);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('データの取得に失敗しました');
    }
  };

  const handleCreatePairing = async () => {
    if (!selectedStudent || !selectedTutor) {
      setError('学生とチューターを選択してください');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/pairings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          tutorId: selectedTutor,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`マッチングが作成されました: ${data.pairing.student.name} × ${data.pairing.tutor.name}`);
        setSelectedStudent('');
        setSelectedTutor('');
        fetchData(); // データを再取得
      } else {
        const error = await response.json();
        setError(error.error || 'マッチングの作成に失敗しました');
      }
    } catch (error) {
      setError('マッチングの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStudents = () => {
    return students.filter(student => student._count.pairings === 0);
  };

  const getAvailableTutors = () => {
    return tutors; // チューターは複数の学生を担当可能
  };

  return (
    <div className="space-y-6">
      {/* マッチング作成フォーム */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            新しいマッチング
          </CardTitle>
          <CardDescription>
            事前面談が完了した学生とチューターをマッチングします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">学生を選択</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="学生を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableStudents().map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex flex-col">
                        <span>{student.name}</span>
                        <span className="text-xs text-gray-500">
                          {student.interests.length > 0 && `興味: ${student.interests.join(', ')}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                未マッチングの学生: {getAvailableStudents().length}名
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">チューターを選択</label>
              <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                <SelectTrigger>
                  <SelectValue placeholder="チューターを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTutors().map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      <div className="flex flex-col">
                        <span>{tutor.name}</span>
                        <span className="text-xs text-gray-500">
                          {tutor.specialties.length > 0 && 
                            `専門: ${tutor.specialties.map(s => specialtyMap[s] || s).join(', ')}`
                          }
                          {tutor._count.pairings > 0 && ` (担当中: ${tutor._count.pairings}名)`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleCreatePairing} 
            disabled={loading || !selectedStudent || !selectedTutor}
            className="w-full"
          >
            {loading ? 'マッチング作成中...' : 'マッチングを作成'}
          </Button>
        </CardContent>
      </Card>

      {/* 既存のマッチング一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            現在のマッチング
          </CardTitle>
          <CardDescription>
            現在アクティブなマッチング一覧
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pairings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              まだマッチングがありません
            </p>
          ) : (
            <div className="space-y-4">
              {pairings.map((pairing) => (
                <div key={pairing.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">
                          {pairing.student.name} × {pairing.tutor.name}
                        </span>
                        <Badge variant={pairing.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {pairing.status === 'ACTIVE' ? 'アクティブ' : pairing.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>学生: {pairing.student.email}</p>
                        <p>チューター: {pairing.tutor.email}</p>
                        {pairing.startedAt && (
                          <p>開始日: {new Date(pairing.startedAt).toLocaleDateString('ja-JP')}</p>
                        )}
                        {pairing.score && (
                          <p>マッチ度: {Math.round(pairing.score * 100)}%</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      作成: {new Date(pairing.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総学生数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-gray-500">
              未マッチング: {getAvailableStudents().length}名
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総チューター数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tutors.length}</div>
            <p className="text-xs text-gray-500">
              稼働中: {tutors.filter(t => t._count.pairings > 0).length}名
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">アクティブマッチング</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pairings.filter(p => p.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-gray-500">
              総マッチング: {pairings.length}件
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}