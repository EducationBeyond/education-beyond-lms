/**
 * Slack Bot クライアント
 * チューターとのメッセージング機能を提供
 */

import { WebClient } from '@slack/web-api';

// Slack Bot 設定
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

/**
 * Slackチャンネルまたはユーザーにメッセージを送信
 */
export async function sendSlackMessage(
  channel: string,
  message: string,
  options?: {
    threadTs?: string;
    blocks?: any[];
  }
): Promise<{ success: boolean; ts?: string; error?: string }> {
  if (!process.env.SLACK_BOT_TOKEN) {
    console.warn('[Slack] Bot token not configured, skipping message');
    return { success: false, error: 'Bot token not configured' };
  }

  try {
    const result = await slack.chat.postMessage({
      channel,
      text: message,
      thread_ts: options?.threadTs,
      blocks: options?.blocks,
    });

    if (result.ok) {
      console.log('[Slack] Message sent successfully to channel:', channel);
      return { success: true, ts: result.ts };
    } else {
      console.error('[Slack] Failed to send message:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('[Slack] Error sending message:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * チューターに学生からのメッセージを転送
 */
export async function sendStudentMessageToTutor(
  tutorSlackId: string,
  studentName: string,
  message: string,
  threadId?: string
): Promise<{ success: boolean; ts?: string; error?: string }> {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `💬 ${studentName}さんからのメッセージ`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🕐 ${new Date().toLocaleString('ja-JP')}`,
        },
      ],
    },
  ];

  return await sendSlackMessage(tutorSlackId, message, {
    threadTs: threadId,
    blocks,
  });
}

/**
 * Slack イベントを処理
 */
export async function handleSlackEvent(event: any): Promise<void> {
  console.log('[Slack] Received event:', event.type);

  if (event.type === 'message' && !event.bot_id && event.text) {
    await handleSlackMessage(event);
  } else if (event.type === 'app_mention') {
    await handleSlackMention(event);
  }
}

/**
 * Slack メッセージを処理
 */
async function handleSlackMessage(event: any): Promise<void> {
  const { user, text, channel, ts, thread_ts } = event;

  console.log('[Slack] Received message from user:', user, 'Message:', text);

  try {
    // 1. Slack User ID から Tutor を特定
    // 2. Tutor のペアリング情報を取得
    // 3. 学生にLINEでメッセージを送信
    // 4. メッセージ履歴をDBに保存

    // この処理は後でメッセージングAPIで実装
    await processTutorMessage(user, text, channel, ts, thread_ts);
  } catch (error) {
    console.error('[Slack] Error processing message:', error);

    // エラー時の応答
    await sendSlackMessage(
      channel,
      '⚠️ メッセージの処理中にエラーが発生しました。システム管理者に連絡してください。',
      { threadTs: thread_ts || ts }
    );
  }
}

/**
 * Slack メンションを処理
 */
async function handleSlackMention(event: any): Promise<void> {
  const { user, text, channel, ts } = event;

  console.log('[Slack] Received mention from user:', user);

  const helpMessage = `👋 Education Beyond LMSです！

📱 *学生とのメッセージング機能*
• 学生がLINEで送信したメッセージがここに転送されます
• あなたがここで返信すると、学生のLINEに送信されます

🔗 *使い方*
1. 学生がLINEでメッセージを送信
2. このSlackチャンネルに転送されます
3. スレッドで返信すると学生のLINEに送信されます

❓ *サポートが必要な場合*
管理者にお問い合わせください。`;

  await sendSlackMessage(channel, helpMessage, { threadTs: ts });
}

/**
 * チューターからのメッセージを処理
 */
async function processTutorMessage(
  slackUserId: string,
  message: string,
  channel: string,
  messageTs: string,
  threadTs?: string
): Promise<void> {
  console.log('[Slack] Processing tutor message:', {
    slackUserId,
    message,
    channel,
    messageTs,
    threadTs,
  });

  try {
    // メッセージングサービスを使用してメッセージを処理
    const { sendMessageFromTutor } = await import('@/lib/messaging-service');
    const result = await sendMessageFromTutor(slackUserId, message, messageTs, threadTs);

    let responseMessage: string;

    if (result.success) {
      responseMessage = '✅ メッセージを学生のLINEに送信しました。';
    } else {
      console.error('[Slack] Failed to process message:', result.error);

      if (result.error === 'Tutor not found') {
        responseMessage = '⚠️ チューター情報が見つかりません。管理者に連絡してください。';
      } else if (result.error === 'No active pairing found') {
        responseMessage = '⚠️ アクティブなペアリングが見つかりません。学生との紐付けを確認してください。';
      } else if (result.error === 'Student LINE account not found') {
        responseMessage = '⚠️ 学生のLINEアカウントが見つかりません。学生にLINE連携を確認してもらってください。';
      } else {
        responseMessage = '❌ メッセージの送信に失敗しました。しばらく後に再度お試しください。';
      }
    }

    await sendSlackMessage(channel, responseMessage, { threadTs: threadTs || messageTs });
  } catch (error) {
    console.error('[Slack] Error processing tutor message:', error);

    await sendSlackMessage(
      channel,
      '❌ システムエラーが発生しました。管理者に連絡してください。',
      { threadTs: threadTs || messageTs }
    );
  }
}

/**
 * ユーザー情報を取得
 */
export async function getSlackUser(userId: string): Promise<any> {
  try {
    const result = await slack.users.info({
      user: userId,
    });

    if (result.ok) {
      return result.user;
    } else {
      console.error('[Slack] Failed to get user info:', result.error);
      return null;
    }
  } catch (error) {
    console.error('[Slack] Error getting user info:', error);
    return null;
  }
}

/**
 * チャンネル一覧を取得
 */
export async function getSlackChannels(): Promise<any[]> {
  try {
    const result = await slack.conversations.list({
      types: 'public_channel,private_channel',
    });

    if (result.ok) {
      return result.channels || [];
    } else {
      console.error('[Slack] Failed to get channels:', result.error);
      return [];
    }
  } catch (error) {
    console.error('[Slack] Error getting channels:', error);
    return [];
  }
}

/**
 * DM チャンネルを開く
 */
export async function openSlackDM(userId: string): Promise<string | null> {
  try {
    const result = await slack.conversations.open({
      users: userId,
    });

    if (result.ok) {
      return result.channel?.id || null;
    } else {
      console.error('[Slack] Failed to open DM:', result.error);
      return null;
    }
  } catch (error) {
    console.error('[Slack] Error opening DM:', error);
    return null;
  }
}