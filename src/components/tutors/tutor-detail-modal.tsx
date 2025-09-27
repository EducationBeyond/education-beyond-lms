'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, User, Mail, Building, MapPin, BookOpen, Calendar, ExternalLink } from 'lucide-react';

interface Tutor {
  id: string;
  email: string;
  lastName: string;
  firstName: string;
  lastNameKana?: string;
  firstNameKana?: string;
  nameAlphabet?: string;
  affiliation?: string;
  address?: string;
  specialties: string[];
  avatarUrl?: string;
  interviewCalendarUrl?: string;
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

interface TutorDetailModalProps {
  tutorId: string | null;
  isOpen: boolean;
  onClose: () => void;
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

export function TutorDetailModal({ tutorId, isOpen, onClose }: TutorDetailModalProps) {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tutorId || !isOpen) {
      setTutor(null);
      setPairing(null);
      setError(null);
      return;
    }

    const fetchTutorDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tutors/${tutorId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch tutor details');
        }

        const data = await response.json();
        setTutor(data.tutor);
        setPairing(data.pairing || null);
      } catch (error) {
        console.error('[TutorDetailModal] Error fetching tutor details:', error);
        setError('チューターの詳細情報を取得できませんでした。');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorDetail();
  }, [tutorId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              チューター詳細
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">読み込み中...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {tutor && (
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {tutor.avatarUrl ? (
                      <Image
                        className="h-16 w-16 rounded-full object-cover"
                        src={tutor.avatarUrl}
                        alt={tutor.lastName + ' ' + tutor.firstName}
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
                    {tutor.lastNameKana && (
                      <p className="text-sm text-gray-500">{tutor.lastNameKana} {tutor.firstNameKana}</p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Email */}
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">メールアドレス</p>
                      <p className="text-sm text-gray-900">{tutor.email}</p>
                    </div>
                  </div>

                  {/* Affiliation */}
                  {tutor.affiliation && (
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">所属</p>
                        <p className="text-sm text-gray-900">{tutor.affiliation}</p>
                      </div>
                    </div>
                  )}

                  {/* Specialties */}
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

                  {/* Registration Date */}
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">登録日</p>
                      <p className="text-sm text-gray-900">
                        {new Date(tutor.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            {tutor && (tutor.interviewCalendarUrl || (tutor.lessonCalendarUrl && pairing && pairing.status === 'ACTIVE')) ? (
              <div className="flex space-x-3">
                {tutor.interviewCalendarUrl && (
                  <button
                    onClick={() => window.open(tutor.interviewCalendarUrl, '_blank')}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    事前面談を予約
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </button>
                )}
                {tutor.lessonCalendarUrl && pairing && pairing.status === 'ACTIVE' && (
                  <button
                    onClick={() => window.open(tutor.lessonCalendarUrl, '_blank')}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    研究予約
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </button>
                )}
              </div>
            ) : (
              <div></div>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
