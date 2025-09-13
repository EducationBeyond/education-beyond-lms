'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home, User, BookOpen, Users, GraduationCap, BarChart3, UserCheck } from 'lucide-react';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUserRole = async () => {
      console.log('[Sidebar] useEffect triggered, session:', !!session, 'email:', session?.user?.email);
      if (session?.user?.email) {
        try {
          console.log('[Sidebar] Fetching role for:', session.user.email);
          const response = await fetch('/api/user/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email }),
          });
          if (response.ok) {
            const { role } = await response.json();
            console.log('[Sidebar] Role fetched successfully:', role);
            setUserRole(role);
          } else {
            console.error('[Sidebar] Failed to fetch role:', response.status);
          }
        } catch (error) {
          console.error('[Sidebar] Failed to fetch user role:', error);
        }
      } else {
        console.log('[Sidebar] No session or email, clearing role');
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [session]);

  const getNavigationItems = (): NavigationItem[] => {
    if (!userRole) return [];

    const baseItems: NavigationItem[] = [
      { href: '/', label: 'ホーム', icon: <Home className="h-5 w-5" /> },
    ];

    switch (userRole) {
      case 'parent':
        return [
          ...baseItems,
          { href: '/parent/profile', label: 'マイページ', icon: <User className="h-5 w-5" /> },
          { href: '/parent/records', label: '学習記録', icon: <BookOpen className="h-5 w-5" /> },
          { href: '/parent/tutor', label: '担当チューター', icon: <GraduationCap className="h-5 w-5" /> },
        ];
      case 'student':
        return [
          ...baseItems,
          { href: '/student/profile', label: 'マイページ', icon: <User className="h-5 w-5" /> },
          { href: '/student/records', label: '学習記録', icon: <BookOpen className="h-5 w-5" /> },
          { href: '/student/tutors', label: 'チューター一覧', icon: <Users className="h-5 w-5" /> },
          { href: '/student/tutor', label: '担当チューター', icon: <GraduationCap className="h-5 w-5" /> },
        ];
      case 'tutor':
        return [
          ...baseItems,
          { href: '/tutor/profile', label: 'マイページ', icon: <User className="h-5 w-5" /> },
          { href: '/tutor/records', label: '授業履歴', icon: <BookOpen className="h-5 w-5" /> },
          { href: '/tutor/students', label: '担当学生', icon: <Users className="h-5 w-5" /> },
        ];
      case 'admin':
        return [
          ...baseItems,
          { href: '/admin/users', label: 'ユーザー管理', icon: <BarChart3 className="h-5 w-5" /> },
          { href: '/admin/matching', label: 'マッチング管理', icon: <UserCheck className="h-5 w-5" /> },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  console.log('[Sidebar] Current state:', { 
    sessionStatus: status, 
    userEmail: session?.user?.email,
    userRole, 
    navigationItemsCount: navigationItems.length 
  });

  // ログインしていない場合はサイドバーを表示しない
  if (!session?.user) {
    return null;
  }

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200">
        <div className="flex items-center flex-shrink-0 px-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-semibold text-lg text-gray-900">Education Beyond</span>
          </Link>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={`mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}