'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';

export function Header() {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      console.log('[Header] useEffect triggered, session:', !!session, 'email:', session?.user?.email);
      if (session?.user?.email) {
        try {
          console.log('[Header] Fetching role for:', session.user.email);
          const response = await fetch('/api/user/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email }),
          });
          if (response.ok) {
            const { role } = await response.json();
            console.log('[Header] Role fetched successfully:', role);
            setUserRole(role);
          } else {
            console.error('[Header] Failed to fetch role:', response.status);
          }
        } catch (error) {
          console.error('[Header] Failed to fetch user role:', error);
        }
      } else {
        console.log('[Header] No session or email, clearing role');
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [session]);

  const getNavigationItems = () => {
    if (!userRole) return [];

    switch (userRole) {
      case 'parent':
        return [
          { href: '/parent/profile', label: 'マイページ' },
          { href: '/parent/records', label: '学習記録' },
          { href: '/parent/tutor', label: '担当チューター' },
        ];
      case 'student':
        return [
          { href: '/student/profile', label: 'マイページ' },
          { href: '/student/records', label: '学習記録' },
          { href: '/student/tutors', label: 'チューター一覧' },
          { href: '/student/tutor', label: '担当チューター' },
        ];
      case 'tutor':
        return [
          { href: '/tutor/profile', label: 'マイページ' },
          { href: '/tutor/records', label: '授業履歴' },
          { href: '/tutor/students', label: '担当学生' },
        ];
      case 'admin':
        return [
          { href: '/admin/users', label: 'ユーザー管理' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();
  
  console.log('[Header] Current state:', { 
    sessionStatus: status, 
    userEmail: session?.user?.email,
    userRole, 
    navigationItemsCount: navigationItems.length 
  });

  return (
    <header className="bg-white shadow-sm border-b lg:pl-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile Logo - Only show on mobile when sidebar is hidden */}
          <div className="flex items-center lg:hidden">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-semibold text-xl text-gray-900">Education Beyond</span>
            </Link>
          </div>

          {/* User Menu - Always visible */}
          <div className="flex items-center space-x-4 ml-auto">
            {status === 'loading' ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-20"></div>
              </div>
            ) : session?.user ? (
              <>

                {/* User Info & Mobile Menu Button */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    {session.user.image ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-700">
                        {session.user.name}
                      </p>
                    </div>
                  </div>

                  {/* Mobile menu button - Only show on mobile/tablet */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  >
                    {isMobileMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </button>

                  {/* Desktop Sign Out Button */}
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="text-gray-700 hover:text-gray-900"
                  >
                    ログアウト
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm">
                  ログイン
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu - Only show on mobile/tablet */}
        {isMobileMenuOpen && session?.user && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link
                href="/"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ホーム
              </Link>
              
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-blue-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}