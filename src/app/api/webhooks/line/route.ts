import { NextRequest, NextResponse } from 'next/server';
import { handleLineWebhook, validateLineSignature } from '@/lib/line-client';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || '';

    console.log('[LINE Webhook] Received webhook request');

    // 署名検証
    if (!validateLineSignature(body, signature)) {
      console.error('[LINE Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // JSONパース
    const events = JSON.parse(body).events;

    // LINE イベントを処理
    await handleLineWebhook(events);

    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('[LINE Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// LINE Platform からのGETリクエスト（接続確認用）
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'LINE Webhook endpoint is active' }, { status: 200 });
}