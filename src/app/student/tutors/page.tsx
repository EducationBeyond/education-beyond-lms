'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, BookOpen, Building, Search, RefreshCw } from 'lucide-react';
import { TutorDetailModal } from '@/components/tutors/tutor-detail-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Tutor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameKana: string;
  lastNameKana: string;
  affiliation?: string;
  specialties: string[];
  avatarUrl?: string;
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

const getTutorDisplayName = (tutor: Tutor) => {
  return `${tutor.lastName} ${tutor.firstName}`;
};

const getTutorKanaName = (tutor: Tutor) => {
  return `${tutor.lastNameKana} ${tutor.firstNameKana}`;
};

export default function StudentTutorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login');
      return;
    }

    fetchTutors();
  }, [session, status, router]);

  const fetchTutors = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tutors');

      if (!response.ok) {
        throw new Error('Failed to fetch tutors');
      }

      const data = await response.json();
      setTutors(data.tutors);
    } catch (error) {
      console.error('[StudentTutorsPage] Error fetching tutors:', error);
      setError('チューター一覧を取得できませんでした。');
    } finally {
      setLoading(false);
    }
  };

  const handleTutorClick = (tutorId: string) => {
    setSelectedTutorId(tutorId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTutorId(null);
  };

  // フィルタリング
  const filteredTutors = tutors.filter(tutor => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = getTutorDisplayName(tutor);
    const kanaName = getTutorKanaName(tutor);
    return (
      fullName.toLowerCase().includes(searchLower) ||
      tutor.firstName.toLowerCase().includes(searchLower) ||
      tutor.lastName.toLowerCase().includes(searchLower) ||
      kanaName.toLowerCase().includes(searchLower) ||
      tutor.firstNameKana.toLowerCase().includes(searchLower) ||
      tutor.lastNameKana.toLowerCase().includes(searchLower) ||
      tutor.affiliation?.toLowerCase().includes(searchLower) ||
      tutor.specialties.some(specialty =>
        (specialtyMap[specialty] || specialty).toLowerCase().includes(searchLower)
      )
    );
  });

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">チューター一覧</h1>
        <p className="text-gray-600">
          利用可能なチューターを閲覧できます。詳細を見るには、カードをクリックしてください。
        </p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="チューター名、所属、専門分野で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Button
          onClick={fetchTutors}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          更新
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">チューター一覧を読み込み中...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTutors} variant="outline">
            再試行
          </Button>
        </div>
      )}

      {/* Tutors Grid */}
      {!loading && !error && (
        <>
          {filteredTutors.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? '検索条件に一致するチューターが見つかりませんでした。' : 'チューターが登録されていません。'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-500">
                {filteredTutors.length}件のチューターが見つかりました
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutors.map((tutor) => (
                  <Card
                    key={tutor.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    onClick={() => handleTutorClick(tutor.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        {tutor.avatarUrl ? (
                          <Image
                            className="h-12 w-12 rounded-full object-cover"
                            src={tutor.avatarUrl}
                            alt={getTutorDisplayName(tutor)}
                            width={48}
                            height={48}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{getTutorDisplayName(tutor)}</CardTitle>
                          <p className="text-sm text-gray-500 truncate">{getTutorKanaName(tutor)}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Affiliation */}
                      {tutor.affiliation && (
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-600 truncate">{tutor.affiliation}</p>
                        </div>
                      )}

                      {/* Specialties */}
                      {tutor.specialties && tutor.specialties.length > 0 && (
                        <div className="flex items-start space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1">
                              {tutor.specialties.slice(0, 3).map((specialty, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {specialtyMap[specialty] || specialty}
                                </span>
                              ))}
                              {tutor.specialties.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  +{tutor.specialties.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Tutor Detail Modal */}
      <TutorDetailModal
        tutorId={selectedTutorId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
