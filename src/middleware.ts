import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';
import type { UserRole } from '@/auth';

// 認証が必要なパス
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/reservations',
  '/learning-records',
  '/api/protected',
];

// ロール別アクセス制御
const roleBasedPaths: Record<string, UserRole[]> = {
  '/dashboard/student': ['STUDENT'],
  '/dashboard/parent': ['PARENT'],
  '/dashboard/tutor': ['TUTOR'],
  '/dashboard/admin': ['ADMIN'],
  '/admin': ['ADMIN'],
  '/tutor': ['TUTOR'],
  '/api/admin': ['ADMIN'],
  '/api/tutor': ['TUTOR'],
  '/api/student': ['STUDENT'],
  '/api/parent': ['PARENT'],
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイル・API route（auth以外）・パブリックパスはスキップ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/' ||
    pathname === '/auth/signin' ||
    pathname === '/auth/error'
  ) {
    return NextResponse.next();
  }

  // セッション取得
  const session = await auth();

  // 認証が必要なパスかチェック
  const needsAuth = protectedPaths.some(path => pathname.startsWith(path));

  if (needsAuth && !session?.user) {
    // 未認証の場合はサインインページにリダイレクト
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // ロールベースアクセス制御
  if (session?.user) {
    for (const [path, allowedRoles] of Object.entries(roleBasedPaths)) {
      if (pathname.startsWith(path)) {
        const userRole = session.user.role;
        
        if (!userRole || !allowedRoles.includes(userRole)) {
          // アクセス権限がない場合は403ページにリダイレクト
          return NextResponse.redirect(new URL('/auth/forbidden', request.url));
        }
      }
    }

    // ロールが未設定の場合はロール選択ページにリダイレクト
    if (!session.user.role && pathname !== '/auth/setup-role') {
      return NextResponse.redirect(new URL('/auth/setup-role', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};