'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Mail, Building, MapPin, BookOpen, Calendar, ExternalLink, GraduationCap, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Tutor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  furigana?: string;
  affiliation?: string;
  address?: string;
  specialties: string[];
  avatarUrl?: string;
  lessonCalendarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pairing {
  id: string;
  status: string;
  score?: number;
  startedAt?: string;
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

export function StudentAssignedTutorClient() {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignedTutor();
  }, []);

  const fetchAssignedTutor = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/assigned-tutor');
      
      if (response.ok) {
        const data = await response.json();
        setTutor(data.tutor);
        setPairing(data.pairing);
      } else {
        const error = await response.json();
        setError(error.error || '担当チューターの取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch assigned tutor:', error);
      setError('担当チューターの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarBooking = () => {
    if (tutor?.lessonCalendarUrl) {
      window.open(tutor.lessonCalendarUrl, '_blank');
    }
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

  if (!tutor || !pairing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            担当チューター
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">まだ担当チューターが決定していません</p>
          <p className="text-sm text-gray-400">
            マッチングが完了すると、こちらに担当チューターの情報が表示されます
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 担当チューター情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            担当チューター
          </CardTitle>
          <CardDescription>
            現在マッチングされているチューターです
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* プロフィール部分 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {tutor.avatarUrl ? (
                  <Image
                    className="h-16 w-16 rounded-full object-cover"
                    src={tutor.avatarUrl}
                    alt={`${tutor.lastName} ${tutor.firstName}`}
                    width={64}
                    height={64}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{tutor.lastName} {tutor.firstName}</h3>
                {tutor.furigana && (
                  <p className="text-sm text-gray-500">{tutor.furigana}</p>
                )}
                {pairing.status && (
                  <Badge className="mt-2" variant={pairing.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {pairing.status === 'ACTIVE' ? 'アクティブ' : pairing.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="grid grid-cols-1 gap-4">
              {/* メールアドレス */}
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">メールアドレス</p>
                  <p className="text-sm text-gray-900">{tutor.email}</p>
                </div>
              </div>

              {/* 所属 */}
              {tutor.affiliation && (
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">所属</p>
                    <p className="text-sm text-gray-900">{tutor.affiliation}</p>
                  </div>
                </div>
              )}

              {/* 住所 */}
              {tutor.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">住所</p>
                    <p className="text-sm text-gray-900">{tutor.address}</p>
                  </div>
                </div>
              )}

              {/* 専門分野 */}
              {tutor.specialties && tutor.specialties.length > 0 && (
                <div className="flex items-start space-x-3">
                  <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">専門分野</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {tutor.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {specialtyMap[specialty] || specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* マッチング開始日 */}
              {pairing.startedAt && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">マッチング開始日</p>
                    <p className="text-sm text-gray-900">
                      {new Date(pairing.startedAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              )}

              {/* マッチ度 */}
              {pairing.score && (
                <div className="flex items-center space-x-3">
                  <UserCheck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">マッチ度</p>
                    <p className="text-sm text-gray-900">{Math.round(pairing.score * 100)}%</p>
                  </div>
                </div>
              )}
            </div>

            {/* 研究予約ボタン */}
            {tutor.lessonCalendarUrl && (
              <div className="border-t pt-4">
                <div className="flex justify-center">
                  <Button 
                    onClick={handleCalendarBooking}
                    className="inline-flex items-center px-6 py-3"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    研究予約
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* マッチング詳細カード */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">マッチング情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">ペアリングID</span>
              <span className="text-sm text-gray-900 font-mono">{pairing.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">マッチング日</span>
              <span className="text-sm text-gray-900">
                {new Date(pairing.createdAt).toLocaleDateString('ja-JP')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">ステータス</span>
              <Badge variant={pairing.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {pairing.status === 'ACTIVE' ? 'アクティブ' : pairing.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}