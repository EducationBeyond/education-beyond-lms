import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');
  const timestamp = searchParams.get('timestamp');

  // シンプルなSVGプレースホルダー画像を生成
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#f3f4f6"/>
      <circle cx="200" cy="160" r="60" fill="#d1d5db"/>
      <path d="M120 280 Q200 240 280 280 L280 400 L120 400 Z" fill="#d1d5db"/>
      <text x="200" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
        プロフィール画像
      </text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400', // 1日キャッシュ
    },
  });
}