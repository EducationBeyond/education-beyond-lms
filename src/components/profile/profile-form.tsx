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
import {
  studentProfileSchema,
  parentProfileSchema,
  tutorProfileSchema,
  type StudentProfileFormData,
  type ParentProfileFormData,
  type TutorProfileFormData
} from '@/lib/validation/profile-schemas';

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
          {role === 'STUDENT' && '参加者プロフィールを編集できます'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓</FormLabel>
                    <FormControl>
                      <Input placeholder="姓を入力" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名</FormLabel>
                    <FormControl>
                      <Input placeholder="名を入力" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastNameKana"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓（ふりがな）</FormLabel>
                    <FormControl>
                      <Input placeholder="せい" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstNameKana"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名（ふりがな）</FormLabel>
                    <FormControl>
                      <Input placeholder="なまえ" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nameAlphabet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>氏名（アルファベット）</FormLabel>
                  <FormControl>
                    <Input placeholder="Taro Yamada" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role === 'PARENT' && (
              <>
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電話番号</FormLabel>
                      <FormControl>
                        <Input placeholder="090-1234-5678" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>郵便番号</FormLabel>
                        <FormControl>
                          <Input placeholder="123-4567" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prefecture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>都道府県</FormLabel>
                        <FormControl>
                          <Input placeholder="東京都" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>市区町村</FormLabel>
                        <FormControl>
                          <Input placeholder="渋谷区" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressDetail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>それ以下の住所</FormLabel>
                        <FormControl>
                          <Input placeholder="道玄坂1-2-3" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}


            {role === 'STUDENT' && (
              <>
                <FormField
                  control={form.control}
                  name="entryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>エントリー種別</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="エントリー種別を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">スタンダード</SelectItem>
                          <SelectItem value="nagano">長野</SelectItem>
                          <SelectItem value="hiroshima">広島</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birthdate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>生年月日</FormLabel>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>学校名</FormLabel>
                        <FormControl>
                          <Input placeholder="○○小学校" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="howDidYouKnow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>プログラムを知った経緯</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="search">インターネット検索</SelectItem>
                            <SelectItem value="sns">SNS</SelectItem>
                            <SelectItem value="friend">知人の紹介</SelectItem>
                            <SelectItem value="school">学校</SelectItem>
                            <SelectItem value="event">イベント</SelectItem>
                            <SelectItem value="other">その他</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="giftedEpisodes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>特異な才能があると思われるエピソード</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="お子様の特異な才能を示すエピソードがあれば記入してください"
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
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>興味のある分野</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="興味のある分野を追加..."
                          suggestions={['生き物', '植物', '食べ物・料理', '社会・くらし', '歴史', '恭竜・化石', '科学・化学', '地球・宇宙', '音・光', '算数・図形', '工作・美術', '乗り物・機械', '音楽・映像', '言語・物語', '心・思想', 'からだ・健康', '環境・SDGs', 'プログラミング', 'その他']}
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
                      <FormLabel>注意事項</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="アレルギーや学習上の配慮事項があれば記入してください"
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
