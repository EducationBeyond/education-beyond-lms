'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TagInput } from '@/components/ui/tag-input';

export const studentProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  furigana: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  giftedTraits: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  cautions: z.string().optional(),
});

export const parentProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  address: z.string().optional(),
});

export const tutorProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  furigana: z.string().optional(),
  address: z.string().optional(),
  affiliation: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
  bankAccountInfo: z.string().optional(),
  interviewCalendarUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  lessonCalendarUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
});

interface ProfileFormProps {
  role: 'STUDENT' | 'PARENT' | 'TUTOR';
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
}

export function ProfileForm({ role, initialData, onSubmit }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getSchema = () => {
    switch (role) {
      case 'STUDENT':
        return studentProfileSchema;
      case 'PARENT':
        return parentProfileSchema;
      case 'TUTOR':
        return tutorProfileSchema;
      default:
        return z.object({});
    }
  };

  // nullの値を空文字列に変換してデフォルト値を準備
  const getDefaultValues = () => {
    if (!initialData) return {};
    
    const cleanedData = { ...initialData };
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === null) {
        cleanedData[key] = '';
      }
    });
    
    return cleanedData;
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: getDefaultValues(),
  });

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await onSubmit(data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>プロフィール編集</CardTitle>
        <CardDescription>
          {role === 'STUDENT' && '学生プロフィールを編集できます'}
          {role === 'PARENT' && '保護者プロフィールを編集できます'}
          {role === 'TUTOR' && 'チュータープロフィールを編集できます'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <AlertDescription>プロフィールが更新されました。</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名前</FormLabel>
                  <FormControl>
                    <Input placeholder="名前を入力" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(role === 'STUDENT' || role === 'TUTOR') && (
              <FormField
                control={form.control}
                name="furigana"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ふりがな</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ふりがなを入力" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(role === 'STUDENT' || role === 'TUTOR' || role === 'PARENT') && (
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>住所</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="住所を入力"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {role === 'STUDENT' && (
              <>
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>誕生日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性別</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="性別を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">男性</SelectItem>
                          <SelectItem value="FEMALE">女性</SelectItem>
                          <SelectItem value="OTHER">その他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="giftedTraits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ギフテッド特性</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="特性を追加..."
                          suggestions={['記憶力', '集中力', '論理的思考力', '創造性', '言語能力', '数学的能力', '芸術的才能', 'リーダーシップ']}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>興味分野</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="興味のある分野を追加..."
                          suggestions={['数学', '英語', '理科', '国語', '社会', '物理', '化学', '生物', '歴史', '地理', 'プログラミング', '美術', '音楽']}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cautions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>気をつけること</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="アレルギーや特記事項があれば記入"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}


            {role === 'TUTOR' && (
              <>
                <FormField
                  control={form.control}
                  name="affiliation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>所属</FormLabel>
                      <FormControl>
                        <Input placeholder="大学名、会社名など" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <FormField
                  control={form.control}
                  name="specialties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>専門分野</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="専門分野を追加..."
                          suggestions={['数学', '英語', '理科', '国語', '社会', '物理', '化学', '生物', '歴史', '地理', 'プログラミング', '統計学', '経済学']}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankAccountInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>振込先</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="銀行口座情報など"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interviewCalendarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>事前面談用カレンダーURL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://calendly.com/your-name/interview"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lessonCalendarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>研究予約用カレンダーURL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://calendly.com/your-name/lesson"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? '更新中...' : '更新する'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}