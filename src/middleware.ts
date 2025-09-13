import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証が必要なパス
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/student',
  '/parent', 
  '/tutor',
  '/admin',
  '/reservations',
  '/learning-records',
  '/api/protected',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイル・API route（auth以外）・パブリックパスはスキップ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/user/role') ||
    pathname.startsWith('/api/profile') ||
    pathname.startsWith('/api/tutors') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/auth/error'
  ) {
    return NextResponse.next();
  }

  // 認証が必要なパスかチェック
  const needsAuth = protectedPaths.some(path => pathname.startsWith(path));

  if (needsAuth) {
    // セッション確認のため、クライアントに認証チェックを委ねる
    // middlewareではセッションチェックをスキップし、クライアント側で行う
    console.log(`[Middleware] Protected path ${pathname} accessed, allowing through for client-side auth check`);
  }

  console.log(`[Middleware] Allowing access to ${pathname}`);
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