/**
 * LINE Bot クライアント
 * 学生とのメッセージング機能を提供
 */

import { Client, TextMessage, WebhookEvent } from '@line/bot-sdk';

// LINE Bot 設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

export const lineClient = new Client(config);

/**
 * LINE ユーザーにメッセージを送信
 */
export async function sendLineMessage(userId: string, message: string): Promise<boolean> {
  if (!config.channelAccessToken) {
    console.warn('[LINE] Channel access token not configured, skipping message');
    return false;
  }

  try {
    const textMessage: TextMessage = {
      type: 'text',
      text: message,
    };

    await lineClient.pushMessage(userId, textMessage);
    console.log('[LINE] Message sent successfully to user:', userId);
    return true;
  } catch (error) {
    console.error('[LINE] Failed to send message:', error);
    return false;
  }
}

/**
 * LINE Webhook イベントを処理
 */
export async function handleLineWebhook(events: WebhookEvent[]): Promise<void> {
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      await handleLineTextMessage(event);
    } else if (event.type === 'follow') {
      await handleLineFollow(event);
    } else if (event.type === 'unfollow') {
      await handleLineUnfollow(event);
    }
  }
}

/**
 * LINE テキストメッセージを処理
 */
async function handleLineTextMessage(event: any): Promise<void> {
  const { replyToken, source, message } = event;
  const userId = source.userId;
  const messageText = message.text;

  console.log('[LINE] Received message from user:', userId, 'Message:', messageText);

  try {
    // 1. ユーザーのペアリング情報を取得
    // 2. チューターにSlackでメッセージを送信
    // 3. メッセージ履歴をDBに保存

    // この処理は後でメッセージングAPIで実装
    await processStudentMessage(userId, messageText, replyToken);
  } catch (error) {
    console.error('[LINE] Error processing message:', error);

    // エラー時の応答
    const errorMessage: TextMessage = {
      type: 'text',
      text: 'メッセージの処理中にエラーが発生しました。しばらく後に再度お試しください。',
    };

    await lineClient.replyMessage(replyToken, errorMessage);
  }
}

/**
 * LINE フォローイベントを処理
 */
async function handleLineFollow(event: any): Promise<void> {
  const { replyToken, source } = event;
  const userId = source.userId;

  console.log('[LINE] User followed bot:', userId);

  const welcomeMessage: TextMessage = {
    type: 'text',
    text: `Education Beyondへようこそ！\n\nこちらのLINEアカウントでチューターとメッセージのやり取りができます。\n\nまずはLMSでLINE連携を設定してください。`,
  };

  try {
    await lineClient.replyMessage(replyToken, welcomeMessage);
  } catch (error) {
    console.error('[LINE] Error sending welcome message:', error);
  }
}

/**
 * LINE アンフォローイベントを処理
 */
async function handleLineUnfollow(event: any): Promise<void> {
  const { source } = event;
  const userId = source.userId;

  console.log('[LINE] User unfollowed bot:', userId);

  // ユーザーのLINE連携を無効化
  // この処理は後でExternalAccountテーブルで管理
}

/**
 * 学生からのメッセージを処理
 */
async function processStudentMessage(
  lineUserId: string,
  message: string,
  replyToken: string
): Promise<void> {
  console.log('[LINE] Processing student message:', { lineUserId, message });

  try {
    // メッセージングサービスを使用してメッセージを処理
    const { sendMessageFromStudent } = await import('@/lib/messaging-service');
    const result = await sendMessageFromStudent(lineUserId, message);

    let responseMessage: TextMessage;

    if (result.success) {
      responseMessage = {
        type: 'text',
        text: '✅ メッセージをチューターに送信しました。',
      };
    } else {
      console.error('[LINE] Failed to process message:', result.error);

      if (result.error === 'Student not found') {
        responseMessage = {
          type: 'text',
          text: 'LMSでLINE連携の設定を完了してください。',
        };
      } else if (result.error === 'No active pairing found') {
        responseMessage = {
          type: 'text',
          text: 'チューターとのペアリングが見つかりません。管理者にお問い合わせください。',
        };
      } else {
        responseMessage = {
          type: 'text',
          text: 'メッセージの送信に失敗しました。しばらく後に再度お試しください。',
        };
      }
    }

    await lineClient.replyMessage(replyToken, responseMessage);
  } catch (error) {
    console.error('[LINE] Error processing student message:', error);

    const errorMessage: TextMessage = {
      type: 'text',
      text: 'システムエラーが発生しました。管理者に連絡してください。',
    };

    await lineClient.replyMessage(replyToken, errorMessage);
  }
}

/**
 * Webhook 署名を検証
 */
export function validateLineSignature(body: string, signature: string): boolean {
  if (!config.channelSecret) {
    console.warn('[LINE] Channel secret not configured, skipping signature validation');
    return true; // 開発環境では検証をスキップ
  }

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('SHA256', config.channelSecret)
    .update(body)
    .digest('base64');

  return signature === expectedSignature;
}