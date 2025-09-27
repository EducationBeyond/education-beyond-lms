'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  firstNameKana: string;
  lastNameKana: string;
  schoolName: string;
}

interface LearningRecordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editingRecord?: {
    id: string;
    studentId: string;
    date: string;
    summary: string;
    durationMin: number;
    goodPoints: string | null;
    improvementPoints: string | null;
    homework: string | null;
    studentLate: boolean;
    tutorLate: boolean;
    additionalNotes: string | null;
  } | null;
}

export function LearningRecordForm({ onSuccess, onCancel, editingRecord }: LearningRecordFormProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    studentId: editingRecord?.studentId || '',
    date: editingRecord ? new Date(editingRecord.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    summary: editingRecord?.summary || '',
    durationMin: editingRecord?.durationMin || 60,
    goodPoints: editingRecord?.goodPoints || '',
    improvementPoints: editingRecord?.improvementPoints || '',
    homework: editingRecord?.homework || '',
    studentLate: editingRecord?.studentLate || false,
    tutorLate: editingRecord?.tutorLate || false,
    additionalNotes: editingRecord?.additionalNotes || '',
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tutor/students');
      if (!response.ok) {
        throw new Error('担当生徒の取得に失敗しました');
      }
      const data = await response.json();
      setStudents(data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'エラー',
        description: '担当生徒の取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingRecord
        ? `/api/learning-records/${editingRecord.id}`
        : '/api/learning-records';

      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `学習記録の${editingRecord ? '更新' : '作成'}に失敗しました`);
      }

      toast({
        title: '成功',
        description: `学習記録を${editingRecord ? '更新' : '作成'}しました`,
      });

      onSuccess();
    } catch (error) {
      console.error(`Error ${editingRecord ? 'updating' : 'creating'} learning record:`, error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : `学習記録の${editingRecord ? '更新' : '作成'}に失敗しました`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">担当生徒を読み込み中...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 生徒選択 */}
            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-sm font-medium">
                生徒 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) => handleInputChange('studentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.studentId ? undefined : "生徒を選択してください"} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.lastName} {student.firstName} ({student.schoolName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 授業日 */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                授業日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
          </div>

          {/* 授業時間 */}
          <div className="space-y-2">
            <Label htmlFor="durationMin" className="text-sm font-medium">
              授業時間（分） <span className="text-red-500">*</span>
            </Label>
            <Input
              id="durationMin"
              type="number"
              min="1"
              value={formData.durationMin}
              onChange={(e) => handleInputChange('durationMin', parseInt(e.target.value))}
              required
              className="max-w-xs"
            />
          </div>

          {/* 授業内容 */}
          <div className="space-y-2">
            <Label htmlFor="summary" className="text-sm font-medium">
              授業内容 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              placeholder="今日の授業内容を記入してください"
              className="min-h-[100px]"
              required
            />
          </div>

          {/* 良かったこと */}
          <div className="space-y-2">
            <Label htmlFor="goodPoints" className="text-sm font-medium">
              良かったこと
            </Label>
            <Textarea
              id="goodPoints"
              value={formData.goodPoints}
              onChange={(e) => handleInputChange('goodPoints', e.target.value)}
              placeholder="生徒の良い点や成長を記入してください"
              className="min-h-[80px]"
            />
          </div>

          {/* 今後の改善点 */}
          <div className="space-y-2">
            <Label htmlFor="improvementPoints" className="text-sm font-medium">
              今後の改善点
            </Label>
            <Textarea
              id="improvementPoints"
              value={formData.improvementPoints}
              onChange={(e) => handleInputChange('improvementPoints', e.target.value)}
              placeholder="今後改善すべき点を記入してください"
              className="min-h-[80px]"
            />
          </div>

          {/* 次回までの宿題 */}
          <div className="space-y-2">
            <Label htmlFor="homework" className="text-sm font-medium">
              次回までの宿題
            </Label>
            <Textarea
              id="homework"
              value={formData.homework}
              onChange={(e) => handleInputChange('homework', e.target.value)}
              placeholder="次回までの宿題や課題を記入してください"
              className="min-h-[80px]"
            />
          </div>

          {/* 遅刻チェック */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">遅刻について</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="studentLate"
                  checked={formData.studentLate}
                  onCheckedChange={(checked) => handleInputChange('studentLate', checked)}
                />
                <Label htmlFor="studentLate" className="text-sm">
                  生徒が遅刻した
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tutorLate"
                  checked={formData.tutorLate}
                  onCheckedChange={(checked) => handleInputChange('tutorLate', checked)}
                />
                <Label htmlFor="tutorLate" className="text-sm">
                  チューターが遅刻した
                </Label>
              </div>
            </div>
          </div>

          {/* その他の備考 */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes" className="text-sm font-medium">
              その他の備考
            </Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
              placeholder="その他の特記事項があれば記入してください"
              className="min-h-[80px]"
            />
          </div>

          {/* 送信ボタン */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={submitting || (!editingRecord && (!formData.studentId || !formData.summary.trim())) || (editingRecord && !formData.summary.trim())}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
{submitting
                ? (editingRecord ? '更新中...' : '作成中...')
                : (editingRecord ? '学習記録を更新' : '学習記録を作成')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              キャンセル
            </Button>
          </div>
        </form>
  );
}
