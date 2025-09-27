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
import { ImageUpload } from '@/components/profile/image-upload';
import { Eye, EyeOff, User, Mail, Lock, Building, MapPin, BookOpen, CreditCard } from 'lucide-react';

const tutorRegistrationSchema = z.object({
  lastName: z.string().min(1, { message: '姓は必須です' }),
  firstName: z.string().min(1, { message: '名は必須です' }),
  lastNameKana: z.string().min(1, { message: '姓（ふりがな）は必須です' }),
  firstNameKana: z.string().min(1, { message: '名（ふりがな）は必須です' }),
  nameAlphabet: z.string().min(1, { message: '氏名（アルファベット）は必須です' }),
  email: z.string().email({ message: '有効なメールアドレスを入力してください' }),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  confirmPassword: z.string().min(8, 'パスワードを再入力してください'),
  phoneNumber: z.string().min(1, { message: '電話番号は必須です' }),
  postalCode: z.string().min(1, { message: '郵便番号は必須です' }),
  prefecture: z.string().min(1, { message: '都道府県は必須です' }),
  city: z.string().min(1, { message: '市区町村は必須です' }),
  addressDetail: z.string().min(1, { message: 'それ以下の住所は必須です' }),
  nearestStation: z.string().min(1, { message: '最寄り駅は必須です' }),
  affiliation: z.string().min(1, { message: '所属は必須です' }),
  education: z.string().min(1, { message: '学歴は必須です' }),
  specialties: z.array(z.string()).min(1, { message: '専門分野を1つ以上選択してください' }),
  selfIntroduction: z.string().min(1, { message: '自己紹介は必須です' }),
  avatarUrl: z.string().optional(),
  bankName: z.string().min(1, { message: '銀行名は必須です' }),
  bankCode: z.string().min(1, { message: '金融機関コードは必須です' }),
  branchName: z.string().min(1, { message: '支店名は必須です' }),
  branchCode: z.string().min(1, { message: '支店コードは必須です' }),
  accountType: z.string().min(1, { message: '口座種別を選択してください' }),
  accountNumber: z.string().min(1, { message: '口座番号は必須です' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

type TutorRegistrationForm = z.infer<typeof tutorRegistrationSchema>;

const specialtyOptions = [
  { value: 'physics', label: '物理学' },
  { value: 'chemistry', label: '化学' },
  { value: 'biology', label: '生物学' },
  { value: 'earth_science', label: '地学/地球科学' },
  { value: 'mathematics', label: '数学' },
  { value: 'statistics', label: '統計学' },
  { value: 'computer_science', label: 'コンピューター科学/情報学' },
  { value: 'programming', label: 'プログラミング' },
  { value: 'mechanical_engineering', label: '機械工学' },
  { value: 'electrical_engineering', label: '電気電子工学' },
  { value: 'civil_engineering', label: '土木工学' },
  { value: 'architecture', label: '建築学' },
  { value: 'other_engineering', label: 'その他の工学分野' },
  { value: 'philosophy', label: '哲学' },
  { value: 'psychology', label: '心理学' },
  { value: 'sociology', label: '社会学' },
  { value: 'anthropology', label: '人類学' },
  { value: 'history', label: '歴史学' },
  { value: 'geography', label: '地理学' },
  { value: 'literature', label: '文学' },
  { value: 'linguistics', label: '言語学' },
  { value: 'economics', label: '経済学' },
  { value: 'law', label: '法学' },
  { value: 'political_science', label: '政治学' },
  { value: 'international_relations', label: '国際関係' },
  { value: 'other_humanities_social', label: 'その他の人文・社会科学分野' },
  { value: 'art', label: '美術' },
  { value: 'design', label: 'デザイン' },
  { value: 'music', label: '音楽' },
  { value: 'video_production', label: '映像制作' },
  { value: 'other_arts', label: 'その他の芸術分野' },
  { value: 'health_sports', label: '健康/スポーツ科学' },
  { value: 'environmental_science', label: '環境学' },
  { value: 'education', label: '教育学' },
  { value: 'cooking_nutrition', label: '料理/栄養' },
];

export function TutorRegistrationForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<TutorRegistrationForm>({
    resolver: zodResolver(tutorRegistrationSchema),
  });

  const watchedSpecialties = watch('specialties') || [];

  const handleImageUpload = (imageUrl: string) => {
    setAvatarUrl(imageUrl);
  };

  const onSubmit = async (data: TutorRegistrationForm) => {
    setIsSubmitting(true);

    try {
      const { confirmPassword, ...submitData } = data;

      // 画像URLを含める
      if (avatarUrl) {
        submitData.avatarUrl = avatarUrl;
      }

      const response = await fetch('/api/register/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('チューターアカウントが正常に作成されました！ログインページに移動します。');
        router.push('/login');
      } else {
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((detail: any) => {
            setError(detail.path[0] as keyof TutorRegistrationForm, {
              message: detail.message,
            });
          });
        } else {
          setError('root', { message: result.error || 'アカウント作成に失敗しました' });
        }
      }
    } catch (error) {
      console.error('[TutorRegistration] Error:', error);
      setError('root', { message: 'ネットワークエラーが発生しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">チューターアカウント登録</CardTitle>
          <p className="text-sm text-gray-600 text-center">
            指導を開始するためのアカウントを作成しましょう
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5" />
                基本情報
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓*
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="田中"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名*
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="花子"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓（ふりがな）*
                  </label>
                  <input
                    {...register('lastNameKana')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="たなか"
                  />
                  {errors.lastNameKana && (
                    <p className="text-sm text-red-600 mt-1">{errors.lastNameKana.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名（ふりがな）*
                  </label>
                  <input
                    {...register('firstNameKana')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="はなこ"
                  />
                  {errors.firstNameKana && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstNameKana.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  氏名（アルファベット）*
                </label>
                <input
                  {...register('nameAlphabet')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Hanako Tanaka"
                />
                {errors.nameAlphabet && (
                  <p className="text-sm text-red-600 mt-1">{errors.nameAlphabet.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス*
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="tutor@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号*
                  </label>
                  <input
                    {...register('phoneNumber')}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="090-1234-5678"
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード*
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="8文字以上"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード確認*
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="パスワード再入力"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                住所情報*
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    郵便番号*
                  </label>
                  <input
                    {...register('postalCode')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123-4567"
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-red-600 mt-1">{errors.postalCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    都道府県*
                  </label>
                  <input
                    {...register('prefecture')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="東京都"
                  />
                  {errors.prefecture && (
                    <p className="text-sm text-red-600 mt-1">{errors.prefecture.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    市区町村*
                  </label>
                  <input
                    {...register('city')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="渋谷区"
                  />
                  {errors.city && (
                    <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    それ以下の住所*
                  </label>
                  <input
                    {...register('addressDetail')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="道玄坂1-2-3"
                  />
                  {errors.addressDetail && (
                    <p className="text-sm text-red-600 mt-1">{errors.addressDetail.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最寄り駅*
                </label>
                <input
                  {...register('nearestStation')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="JR渋谷駅"
                />
                {errors.nearestStation && (
                  <p className="text-sm text-red-600 mt-1">{errors.nearestStation.message}</p>
                )}
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Building className="h-5 w-5" />
                プロフィール情報*
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    所属*
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      {...register('affiliation')}
                      type="text"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="東京大学大学院"
                    />
                    {errors.affiliation && (
                      <p className="text-sm text-red-600 mt-1">{errors.affiliation.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学歴*
                  </label>
                  <input
                    {...register('education')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="東京大学理学部数学科卒業"
                  />
                  {errors.education && (
                    <p className="text-sm text-red-600 mt-1">{errors.education.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自己紹介*
                </label>
                <textarea
                  {...register('selfIntroduction')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="指導経験や教育への想いなどを紹介してください"
                />
                {errors.selfIntroduction && (
                  <p className="text-sm text-red-600 mt-1">{errors.selfIntroduction.message}</p>
                )}
              </div>

              <div>
                <ImageUpload
                  currentImageUrl={avatarUrl}
                  onImageUpload={handleImageUpload}
                />
              </div>
            </div>

            {/* Specialties */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                専門分野*
              </h3>
              <p className="text-sm text-gray-600">伴走できる専門分野を選択してください</p>
              <CheckboxTagInput
                value={watchedSpecialties}
                onChange={(specialties) => setValue('specialties', specialties)}
                options={specialtyOptions}
                allowCustomTags={true}
              />
              {errors.specialties && (
                <p className="text-sm text-red-600 mt-1">{errors.specialties.message}</p>
              )}
            </div>

            {/* Bank Account Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                振込先情報*
              </h3>
              <p className="text-sm text-gray-600">
                後から設定することも可能です。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    銀行名*
                  </label>
                  <input
                    {...register('bankName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="三菱UFJ銀行"
                  />
                  {errors.bankName && (
                    <p className="text-sm text-red-600 mt-1">{errors.bankName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金融機関コード*
                  </label>
                  <input
                    {...register('bankCode')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0005"
                  />
                  {errors.bankCode && (
                    <p className="text-sm text-red-600 mt-1">{errors.bankCode.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    支店名*
                  </label>
                  <input
                    {...register('branchName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="新宿支店"
                  />
                  {errors.branchName && (
                    <p className="text-sm text-red-600 mt-1">{errors.branchName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    支店コード*
                  </label>
                  <input
                    {...register('branchCode')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="160"
                  />
                  {errors.branchCode && (
                    <p className="text-sm text-red-600 mt-1">{errors.branchCode.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    口座種別*
                  </label>
                  <select
                    {...register('accountType')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="普通">普通</option>
                    <option value="当座">当座</option>
                  </select>
                  {errors.accountType && (
                    <p className="text-sm text-red-600 mt-1">{errors.accountType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    口座番号*
                  </label>
                  <input
                    {...register('accountNumber')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1234567"
                  />
                  {errors.accountNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.accountNumber.message}</p>
                  )}
                </div>
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
