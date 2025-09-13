import { NextRequest, NextResponse } from 'next/server';
import { getUserRole, getRoleRedirectPath } from '@/lib/user-role';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const role = await getUserRole(email);
    
    if (!role) {
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 404 }
      );
    }

    const redirectPath = getRoleRedirectPath(role);

    return NextResponse.json({
      role,
      redirectPath,
    });
  } catch (error) {
    console.error('[API] Role detection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}