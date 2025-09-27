import { NextRequest, NextResponse } from 'next/server';
import { handleSlackEvent } from '@/lib/slack-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Slack Webhook] Received webhook request:', body.type);

    // URL Verification (Slack App設定時の確認)
    if (body.type === 'url_verification') {
      console.log('[Slack Webhook] URL verification request');
      return NextResponse.json({ challenge: body.challenge }, { status: 200 });
    }

    // Event Subscription
    if (body.type === 'event_callback') {
      // 自分のボットからのメッセージは無視
      if (body.event.bot_id) {
        return NextResponse.json({ message: 'OK' }, { status: 200 });
      }

      await handleSlackEvent(body.event);
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    console.log('[Slack Webhook] Unknown event type:', body.type);
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('[Slack Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Slack からのGETリクエスト（接続確認用）
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Slack Webhook endpoint is active' }, { status: 200 });
}