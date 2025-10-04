import { NextRequest, NextResponse } from 'next/server';
import { verifySlackSignature } from '@/lib/messaging/slack-client';
import { relaySlackToLine } from '@/lib/messaging/relay-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);

    console.log('[Slack Webhook] Received webhook request', { type: data.type });

    // URL Verification (Slack App設定時の確認) - 署名検証前に処理
    if (data.type === 'url_verification') {
      console.log('[Slack Webhook] URL verification request');
      return NextResponse.json({ challenge: data.challenge }, { status: 200 });
    }

    // 署名検証（URL検証以外のすべてのリクエスト）
    const signature = request.headers.get('x-slack-signature');
    const timestamp = request.headers.get('x-slack-request-timestamp');

    if (signature && timestamp) {
      const signingSecret = process.env.SLACK_SIGNING_SECRET || '';
      if (!verifySlackSignature(signingSecret, signature, timestamp, body)) {
        console.error('[Slack Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Event Subscription
    if (data.type === 'event_callback') {
      const event = data.event;

      // 自分のボットからのメッセージは無視
      if (event.bot_id) {
        console.log('[Slack Webhook] Skipping bot message');
        return NextResponse.json({ message: 'OK' }, { status: 200 });
      }

      // メッセージイベントのみ処理
      if (event.type === 'message' && event.text) {
        await handleSlackMessage(event);
      }

      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    console.log('[Slack Webhook] Unknown event type:', data.type);
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('[Slack Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSlackMessage(event: any) {
  console.log('[Slack Webhook] Processing message:', {
    channel: event.channel,
    user: event.user,
    ts: event.ts,
    text: event.text?.substring(0, 50),
  });

  try {
    await relaySlackToLine({
      slackChannelId: event.channel,
      slackUserId: event.user,
      slackMessageTs: event.ts,
      messageType: 'text',
      text: event.text,
      files: event.files,
    });
  } catch (error) {
    console.error('[Slack Webhook] Error relaying message:', error);
    // エラーはログに記録するが、Slackには200を返す
  }
}

// Slack からのGETリクエスト（接続確認用）
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Slack Webhook endpoint is active' }, { status: 200 });
}