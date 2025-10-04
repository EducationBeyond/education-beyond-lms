import { NextRequest, NextResponse } from 'next/server';
import { WebhookEvent, MessageEvent, TextEventMessage, ImageEventMessage } from '@line/bot-sdk';
import { verifyLineSignature } from '@/lib/messaging/line-client';
import { relayLineToSlack } from '@/lib/messaging/relay-service';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!signature) {
      console.error('[LINE Webhook] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    console.log('[LINE Webhook] Received webhook request');

    // 署名検証
    if (!verifyLineSignature(body, signature)) {
      console.error('[LINE Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const events: WebhookEvent[] = data.events || [];

    console.log(`[LINE Webhook] Received ${events.length} events`);

    // イベントを処理
    await Promise.all(
      events.map(async (event) => {
        try {
          await handleLineEvent(event);
        } catch (error) {
          console.error('[LINE Webhook] Error handling event:', error);
          // 個別のイベント処理エラーは記録するが、全体のレスポンスには影響させない
        }
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LINE Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleLineEvent(event: WebhookEvent) {
  console.log('[LINE Webhook] Event type:', event.type);

  // メッセージイベントのみ処理
  if (event.type !== 'message') {
    console.log('[LINE Webhook] Skipping non-message event');
    return;
  }

  const messageEvent = event as MessageEvent;
  const message = messageEvent.message;

  // グループメッセージのみ処理（個人トークは除外）
  if (messageEvent.source.type !== 'group') {
    console.log('[LINE Webhook] Skipping non-group message');
    return;
  }

  const lineGroupId = messageEvent.source.groupId!;
  const lineUserId = messageEvent.source.userId || 'unknown';
  const messageId = message.id;

  console.log('[LINE Webhook] Processing message:', {
    groupId: lineGroupId,
    userId: lineUserId,
    messageId,
    messageType: message.type,
  });

  // メッセージタイプに応じて中継
  if (message.type === 'text') {
    const textMessage = message as TextEventMessage;
    await relayLineToSlack({
      lineGroupId,
      lineUserId,
      lineMessageId: messageId,
      messageType: 'text',
      text: textMessage.text,
    });
  } else if (message.type === 'image') {
    const imageMessage = message as ImageEventMessage;
    await relayLineToSlack({
      lineGroupId,
      lineUserId,
      lineMessageId: messageId,
      messageType: 'image',
      text: '画像が送信されました',
      mediaUrl: `https://api.line.me/v2/bot/message/${messageId}/content`,
    });
  } else {
    console.log(`[LINE Webhook] Unsupported message type: ${message.type}`);
  }
}

// LINE Platform からのGETリクエスト（接続確認用）
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'LINE Webhook endpoint is active' }, { status: 200 });
}