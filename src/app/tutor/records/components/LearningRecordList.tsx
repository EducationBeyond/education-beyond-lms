'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Clock, BookOpen, AlertTriangle, CheckCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Student {
  firstName: string;
  lastName: string;
  firstNameKana: string;
  lastNameKana: string;
}

interface LearningRecord {
  id: string;
  date: string;
  summary: string;
  durationMin: number;
  goodPoints: string | null;
  improvementPoints: string | null;
  homework: string | null;
  studentLate: boolean;
  tutorLate: boolean;
  additionalNotes: string | null;
  student: Student;
  createdAt: string;
}

interface LearningRecordListProps {
  refreshTrigger: number;
  onEdit?: (record: LearningRecord) => void;
  onDelete?: (recordId: string) => void;
}

export function LearningRecordList({ refreshTrigger, onEdit, onDelete }: LearningRecordListProps) {
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecords();
  }, [refreshTrigger, limit, offset]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`/api/learning-records?${params}`);
      if (!response.ok) {
        throw new Error('学習記録の取得に失敗しました');
      }

      const data = await response.json();
      setRecords(data.records);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching learning records:', error);
      toast({
        title: 'エラー',
        description: '学習記録の取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${record.student.lastName} ${record.student.firstName}`.includes(searchTerm) ||
      `${record.student.lastNameKana} ${record.student.firstNameKana}`.includes(searchTerm);

    const matchesStudent =
      selectedStudent === 'all' ||
      `${record.student.lastName} ${record.student.firstName}` === selectedStudent;

    return matchesSearch && matchesStudent;
  });

  // 学生一覧を取得（フィルタ用）
  const students = Array.from(
    new Set(records.map(record => `${record.student.lastName} ${record.student.firstName}`))
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年M月d日(E)', { locale: ja });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}時間${mins > 0 ? `${mins}分` : ''}`;
    }
    return `${mins}分`;
  };

  const handleDelete = async (recordId: string) => {
    try {
      const response = await fetch(`/api/learning-records/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '学習記録の削除に失敗しました');
      }

      toast({
        title: '成功',
        description: '学習記録を削除しました',
      });

      // リストから削除
      setRecords(records.filter(record => record.id !== recordId));
      onDelete?.(recordId);
    } catch (error) {
      console.error('Error deleting learning record:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '学習記録の削除に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">学習記録を読み込み中...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 検索・フィルタ */}
      <Card>
        <CardHeader>
          <CardTitle>学習記録一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="生徒名や授業内容で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="生徒を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての生徒</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student} value={student}>
                      {student}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 学習記録リスト */}
          <div className="space-y-4">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>学習記録が見つかりませんでした</p>
                {searchTerm || selectedStudent !== 'all' ? (
                  <p className="text-sm mt-2">検索条件を変更してお試しください</p>
                ) : (
                  <p className="text-sm mt-2">最初の学習記録を作成してみましょう</p>
                )}
              </div>
            ) : (
              filteredRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* 基本情報 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg">
                            {record.student.lastName} {record.student.firstName}
                          </h3>
                          <Badge variant="outline">
                            {formatDate(record.date)}
                          </Badge>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{formatDuration(record.durationMin)}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* 授業内容 */}
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-1">授業内容</h4>
                            <p className="text-gray-900">{record.summary}</p>
                          </div>

                          {/* 良かったこと */}
                          {record.goodPoints && (
                            <div>
                              <h4 className="font-medium text-sm text-green-700 mb-1 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                良かったこと
                              </h4>
                              <p className="text-gray-900">{record.goodPoints}</p>
                            </div>
                          )}

                          {/* 改善点 */}
                          {record.improvementPoints && (
                            <div>
                              <h4 className="font-medium text-sm text-orange-700 mb-1 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" />
                                今後の改善点
                              </h4>
                              <p className="text-gray-900">{record.improvementPoints}</p>
                            </div>
                          )}

                          {/* 宿題 */}
                          {record.homework && (
                            <div>
                              <h4 className="font-medium text-sm text-blue-700 mb-1">宿題</h4>
                              <p className="text-gray-900">{record.homework}</p>
                            </div>
                          )}

                          {/* その他の備考 */}
                          {record.additionalNotes && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-1">その他の備考</h4>
                              <p className="text-gray-900">{record.additionalNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* サイド情報とアクション */}
                      <div className="lg:w-48 space-y-3">
                        {/* アクションボタン */}
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">アクションメニューを開く</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => onEdit?.(record)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                編集
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(record.id)}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                削除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {/* 遅刻情報 */}
                        {(record.studentLate || record.tutorLate) && (
                          <div className="space-y-1">
                            <h4 className="font-medium text-sm text-gray-700">遅刻情報</h4>
                            {record.studentLate && (
                              <Badge variant="destructive" className="text-xs">
                                生徒遅刻
                              </Badge>
                            )}
                            {record.tutorLate && (
                              <Badge variant="destructive" className="text-xs">
                                チューター遅刻
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* 作成日時 */}
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">記録作成日</h4>
                          <p className="text-xs text-gray-600">
                            {formatDate(record.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* ページネーション */}
          {total > limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                {total}件中 {offset + 1} - {Math.min(offset + limit, total)}件を表示
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                >
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={offset + limit >= total}
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}