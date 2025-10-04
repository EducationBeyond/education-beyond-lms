import { WebClient } from '@slack/web-api';
import crypto from 'crypto';

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

export interface SlackSendMessageParams {
  channel: string;
  text?: string;
  blocks?: any[];
  thread_ts?: string;
}

/**
 * Slackにテキストメッセージを送信
 */
export async function sendSlackMessage(
  channel: string,
  text: string,
  senderName?: string,
  threadTs?: string
) {
  const formattedText = senderName ? `*${senderName}*: ${text}` : text;

  return slackClient.chat.postMessage({
    channel,
    text: formattedText,
    thread_ts: threadTs,
  });
}

/**
 * Slackに画像付きメッセージを送信
 */
export async function sendSlackImageMessage(
  channel: string,
  imageUrl: string,
  text?: string,
  senderName?: string
) {
  const blocks = [
    {
      type: 'image',
      image_url: imageUrl,
      alt_text: text || 'Image',
    },
  ];

  if (text || senderName) {
    blocks.unshift({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: senderName ? `*${senderName}*: ${text || ''}` : text || '',
      },
    } as any);
  }

  return slackClient.chat.postMessage({
    channel,
    blocks,
    text: text || 'Image message',
  });
}

/**
 * Slackファイルをアップロード
 */
export async function uploadSlackFile(
  channel: string,
  file: Buffer,
  filename: string,
  title?: string
) {
  return slackClient.files.uploadV2({
    channel_id: channel,
    file,
    filename,
    title,
  });
}

/**
 * Slackチャネル情報を取得
 */
export async function getSlackChannelInfo(channelId: string) {
  return slackClient.conversations.info({
    channel: channelId,
  });
}

/**
 * Slackユーザー情報を取得
 */
export async function getSlackUserInfo(userId: string) {
  return slackClient.users.info({
    user: userId,
  });
}

/**
 * Slack Webhook署名検証
 */
export function verifySlackSignature(
  signingSecret: string,
  requestSignature: string,
  timestamp: string,
  body: string
): boolean {
  // タイムスタンプが5分以上古い場合は拒否
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 60 * 5) {
    return false;
  }

  const signatureBaseString = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', signingSecret);
  const computedSignature = 'v0=' + hmac.update(signatureBaseString).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(requestSignature)
  );
}

/**
 * Slackメッセージのパーマリンクを取得
 */
export async function getSlackPermalink(channel: string, messageTs: string) {
  return slackClient.chat.getPermalink({
    channel,
    message_ts: messageTs,
  });
}

export { slackClient };
