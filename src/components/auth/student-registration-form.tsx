'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckboxTagInput } from '@/components/ui/tag-input';
import { Eye, EyeOff, User, Mail, Lock, Calendar, MapPin, Heart, UserCheck } from 'lucide-react';

const studentRegistrationSchema = z.object({
  // 保護者情報
  parentEmail: z.string().email('有効なメールアドレスを入力してください'),
  parentPassword: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  parentConfirmPassword: z.string().min(8, 'パスワードを再入力してください'),
  parentName: z.string().min(1, '保護者名は必須です'),
  parentAddress: z.string().optional(),

  // 学生情報（メールアドレスとパスワードは運営側で後から設定）
  name: z.string().min(1, '名前は必須です'),
  furigana: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  interests: z.array(z.string()).optional(),
  giftedTraits: z.array(z.string()).optional(),
  cautions: z.string().optional(),
})
.refine((data) => data.parentPassword === data.parentConfirmPassword, {
  message: '保護者のパスワードが一致しません',
  path: ['parentConfirmPassword'],
});

type StudentRegistrationForm = z.infer<typeof studentRegistrationSchema>;

const interestOptions = [
  { value: 'mathematics', label: '数学' },
  { value: 'english', label: '英語' },
  { value: 'science', label: '理科' },
  { value: 'japanese', label: '国語' },
  { value: 'social_studies', label: '社会' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
  { value: 'biology', label: '生物' },
  { value: 'history', label: '歴史' },
  { value: 'geography', label: '地理' },
];

const giftedTraitsOptions = [
  '記憶力',
  '集中力',
  '論理的思考力',
  '創造性',
  '言語能力',
  '数学的能力',
  '芸術的才能',
  'リーダーシップ',
];

export function StudentRegistrationForm() {
  const router = useRouter();
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [showParentConfirmPassword, setShowParentConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<StudentRegistrationForm>({
    resolver: zodResolver(studentRegistrationSchema),
  });

  const watchedInterests = watch('interests') || [];
  const watchedGiftedTraits = watch('giftedTraits') || [];

  const onSubmit = async (data: StudentRegistrationForm) => {
    setIsSubmitting(true);

    try {
      const {
        parentConfirmPassword,
        parentEmail,
        parentPassword,
        parentName,
        parentAddress,
        ...studentData
      } = data;

      // 保護者と学生の両方の情報を含むペイロード
      const submitData = {
        parent: {
          email: parentEmail,
          password: parentPassword,
          name: parentName,
          address: parentAddress || undefined,
        },
        student: studentData,
      };

      const response = await fetch('/api/register/student-with-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/register/student/success');
      } else {
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((detail: any) => {
            const fieldPath = detail.path.join('.');
            // parent.email -> parentEmail のようにマッピング
            const mappedPath = fieldPath.replace('parent.', 'parent').replace('student.', '') as keyof StudentRegistrationForm;
            setError(mappedPath, {
              message: detail.message,
            });
          });
        } else {
          setError('root', { message: result.error || 'アカウント作成に失敗しました' });
        }
      }
    } catch (error) {
      console.error('[StudentRegistration] Error:', error);
      setError('root', { message: 'ネットワークエラーが発生しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">学生アカウント登録</CardTitle>
          <p className="text-sm text-gray-600 text-center">
            保護者と学生の情報を入力して、学習を始めるためのアカウントを作成しましょう
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Parent Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                保護者情報
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    保護者メールアドレス*
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      {...register('parentEmail')}
                      type="email"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="parent@example.com"
                    />
                  </div>
                  {errors.parentEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.parentEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    保護者名*
                  </label>
                  <input
                    {...register('parentName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="山田花子"
                  />
                  {errors.parentName && (
                    <p className="text-sm text-red-600 mt-1">{errors.parentName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    保護者パスワード*
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      {...register('parentPassword')}
                      type={showParentPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="8文字以上"
                    />
                    <button
                      type="button"
                      onClick={() => setShowParentPassword(!showParentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showParentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.parentPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.parentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    保護者パスワード確認*
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      {...register('parentConfirmPassword')}
                      type={showParentConfirmPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="パスワード再入力"
                    />
                    <button
                      type="button"
                      onClick={() => setShowParentConfirmPassword(!showParentConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showParentConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.parentConfirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.parentConfirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  保護者住所（任意）
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    {...register('parentAddress')}
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="東京都渋谷区..."
                  />
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5" />
                学生基本情報
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名前*
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="山田太郎"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ふりがな
                  </label>
                  <input
                    {...register('furigana')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="やまだたろう"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生年月日
                  </label>
                  <input
                    {...register('birthdate')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    性別
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="MALE">男性</option>
                    <option value="FEMALE">女性</option>
                    <option value="OTHER">その他</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住所
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    {...register('address')}
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="東京都渋谷区..."
                  />
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Heart className="h-5 w-5" />
                興味のある分野（任意）
              </h3>
              <CheckboxTagInput
                value={watchedInterests}
                onChange={(interests) => setValue('interests', interests)}
                options={interestOptions}
                allowCustomTags={true}
                placeholder="カスタム分野を追加..."
              />
            </div>

            {/* Gifted Traits */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">ギフテッド特性（任意）</h3>
              <CheckboxTagInput
                value={watchedGiftedTraits}
                onChange={(traits) => setValue('giftedTraits', traits)}
                options={giftedTraitsOptions.map(trait => ({ value: trait, label: trait }))}
                allowCustomTags={true}
                placeholder="カスタム特性を追加..."
              />
            </div>

            {/* Special Notes */}
            <div className="space-y-4 border-t pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  特記事項・配慮が必要なこと（任意）
                </label>
                <textarea
                  {...register('cautions')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="アレルギーや学習上の配慮事項があれば記入してください"
                />
              </div>
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
              {isSubmitting ? '登録中...' : 'アカウントを作成'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                すでにアカウントをお持ちですか？{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-500">
                  ログイン
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
