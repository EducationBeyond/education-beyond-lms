import { Client, ClientConfig, MessageAPIResponseBase, TextMessage, ImageMessage, FlexMessage } from '@line/bot-sdk';

const config: ClientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

export const lineClient = new Client(config);

export interface LineSendMessageParams {
  to: string; // userId or groupId
  text?: string;
  imageUrl?: string;
  flexMessage?: FlexMessage;
}

/**
 * LINEにテキストメッセージを送信
 */
export async function sendLineTextMessage(
  to: string,
  text: string,
  senderName?: string
): Promise<MessageAPIResponseBase> {
  const message: TextMessage = {
    type: 'text',
    text: senderName ? `${senderName}: ${text}` : text,
  };

  return lineClient.pushMessage(to, message);
}

/**
 * LINEに画像メッセージを送信
 */
export async function sendLineImageMessage(
  to: string,
  originalContentUrl: string,
  previewImageUrl: string
): Promise<MessageAPIResponseBase> {
  const message: ImageMessage = {
    type: 'image',
    originalContentUrl,
    previewImageUrl,
  };

  return lineClient.pushMessage(to, message);
}

/**
 * LINEメッセージのコンテンツを取得（画像・動画など）
 */
export async function getLineMessageContent(messageId: string): Promise<Buffer> {
  const stream = await lineClient.getMessageContent(messageId);
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * LINE Webhook署名検証
 */
export function verifyLineSignature(body: string, signature: string): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', process.env.LINE_CHANNEL_SECRET || '')
    .update(body)
    .digest('base64');

  return hash === signature;
}

/**
 * LINEグループ情報を取得
 */
export async function getLineGroupSummary(groupId: string) {
  return lineClient.getGroupSummary(groupId);
}

/**
 * LINEユーザープロフィールを取得
 */
export async function getLineProfile(userId: string) {
  return lineClient.getProfile(userId);
}
