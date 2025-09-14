'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagInput } from '@/components/ui/tag-input';
import { BookOpen, Clock, Star, Tag } from 'lucide-react';

const learningRecordSchema = z.object({
  summary: z.string().min(1, '学習内容は必須です'),
  materials: z.array(z.string()).optional(),
  durationMin: z.number().min(1, '学習時間は1分以上で入力してください'),
  score: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
});

type LearningRecordForm = z.infer<typeof learningRecordSchema>;

interface LearningRecordFormProps {
  studentId: string;
  tutorId: string;
  onSubmit: (data: LearningRecordForm) => Promise<void>;
}

const materialSuggestions = [
  '教科書',
  'プリント',
  'オンライン資料',
  '動画教材',
  '問題集',
  'ノート',
  'ホワイトボード',
  'タブレット',
  'PC',
  '実験器具',
];

const tagSuggestions = [
  '基礎',
  '応用',
  '復習',
  '予習',
  '宿題',
  'テスト対策',
  '苦手克服',
  '得意分野',
  '新単元',
  '総復習',
];

export function LearningRecordForm({ studentId, tutorId, onSubmit }: LearningRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<LearningRecordForm>({
    resolver: zodResolver(learningRecordSchema),
    defaultValues: {
      materials: [],
      tags: [],
    },
  });

  const watchedMaterials = watch('materials') || [];
  const watchedTags = watch('tags') || [];

  const handleFormSubmit = async (data: LearningRecordForm) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('[LearningRecordForm] Error:', error);
      setError('root', { message: '学習記録の作成に失敗しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          学習記録作成
        </CardTitle>
        <p className="text-sm text-gray-600">
          今回の学習内容を記録しましょう
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Summary */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              学習内容*
            </label>
            <textarea
              {...register('summary')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="今回の学習で行ったことを詳しく記述してください..."
            />
            {errors.summary && (
              <p className="text-sm text-red-600">{errors.summary.message}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              学習時間（分）*
            </label>
            <input
              {...register('durationMin', { valueAsNumber: true })}
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="60"
            />
            {errors.durationMin && (
              <p className="text-sm text-red-600">{errors.durationMin.message}</p>
            )}
          </div>

          {/* Materials */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              使用教材（任意）
            </label>
            <TagInput
              value={watchedMaterials}
              onChange={(materials) => setValue('materials', materials)}
              placeholder="使用した教材を入力..."
              suggestions={materialSuggestions}
            />
          </div>

          {/* Score */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Star className="h-4 w-4" />
              理解度（任意）
            </label>
            <select
              {...register('score', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">選択してください</option>
              <option value={1}>1 - 理解できていない</option>
              <option value={2}>2 - あまり理解できていない</option>
              <option value={3}>3 - ある程度理解できている</option>
              <option value={4}>4 - よく理解できている</option>
              <option value={5}>5 - 完全に理解できている</option>
            </select>
            {errors.score && (
              <p className="text-sm text-red-600">{errors.score.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              タグ（任意）
            </label>
            <TagInput
              value={watchedTags}
              onChange={(tags) => setValue('tags', tags)}
              placeholder="タグを追加..."
              suggestions={tagSuggestions}
              maxTags={10}
            />
          </div>

          {errors.root && (
            <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-md">
              {errors.root.message}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? '作成中...' : '学習記録を作成'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}