import { prisma } from '@/lib/prisma';
import { sendLineTextMessage, sendLineImageMessage } from './line-client';
import { sendSlackMessage, sendSlackImageMessage } from './slack-client';

/**
 * LINEからSlackへメッセージを中継
 */
export async function relayLineToSlack(params: {
  lineGroupId: string;
  lineUserId: string;
  lineMessageId: string;
  messageType: string;
  text?: string;
  mediaUrl?: string;
}): Promise<void> {
  const { lineGroupId, lineUserId, lineMessageId, messageType, text, mediaUrl } = params;

  try {
    // LINE User IDからStudentを取得
    const student = await prisma.student.findUnique({
      where: { lineUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!student) {
      console.warn(`[RelayService] Student not found for LINE user: ${lineUserId}`);
      return;
    }

    // LINEグループIDからPairingを取得
    const pairing = await prisma.pairing.findFirst({
      where: {
        lineGroupId,
        studentId: student.id,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        tutor: {
          select: { slackUserId: true },
        },
      },
    });

    if (!pairing || !pairing.slackChannelId) {
      console.warn(`[RelayService] No active pairing found for LINE group: ${lineGroupId}`);
      return;
    }

    const senderName = `${student.lastName} ${student.firstName}`;

    // メッセージタイプに応じて送信
    if (messageType === 'text' && text) {
      await sendSlackMessage(pairing.slackChannelId, text, senderName);
    } else if (messageType === 'image' && mediaUrl) {
      await sendSlackImageMessage(
        pairing.slackChannelId,
        mediaUrl,
        text,
        senderName
      );
    } else {
      console.warn(`[RelayService] Unsupported message type: ${messageType}`);
      return;
    }

    console.log(`[RelayService] Successfully relayed LINE → Slack: ${lineMessageId}`);
  } catch (error) {
    console.error('[RelayService] Error relaying LINE to Slack:', error);
    throw error;
  }
}

/**
 * SlackからLINEへメッセージを中継
 */
export async function relaySlackToLine(params: {
  slackChannelId: string;
  slackUserId: string;
  slackMessageTs: string;
  messageType: string;
  text?: string;
  files?: Array<{ url_private: string; name: string }>;
}): Promise<void> {
  const { slackChannelId, slackUserId, slackMessageTs, messageType, text, files } = params;

  try {
    // Slack User IDからTutorを取得
    const tutor = await prisma.tutor.findUnique({
      where: { slackUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!tutor) {
      console.warn(`[RelayService] Tutor not found for Slack user: ${slackUserId}`);
      return;
    }

    // SlackチャネルIDからPairingを取得
    const pairing = await prisma.pairing.findFirst({
      where: {
        slackChannelId,
        tutorId: tutor.id,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        student: {
          select: { lineUserId: true },
        },
      },
    });

    if (!pairing || !pairing.lineGroupId) {
      console.warn(`[RelayService] No active pairing found for Slack channel: ${slackChannelId}`);
      return;
    }

    const senderName = `${tutor.lastName} ${tutor.firstName}`;

    // メッセージタイプに応じて送信
    if (messageType === 'text' && text) {
      await sendLineTextMessage(pairing.lineGroupId, text, senderName);
    } else if (files && files.length > 0) {
      // 画像の場合（簡易実装）
      const file = files[0];
      if (file.url_private) {
        await sendLineImageMessage(
          pairing.lineGroupId,
          file.url_private,
          file.url_private
        );
      }
    } else {
      console.warn(`[RelayService] Unsupported message type: ${messageType}`);
      return;
    }

    console.log(`[RelayService] Successfully relayed Slack → LINE: ${slackMessageTs}`);
  } catch (error) {
    console.error('[RelayService] Error relaying Slack to LINE:', error);
    throw error;
  }
}

/**
 * PairingにLINE/SlackチャネルIDを設定
 */
export async function updatePairingChannels(
  pairingId: string,
  lineGroupId?: string,
  slackChannelId?: string
) {
  return prisma.pairing.update({
    where: { id: pairingId },
    data: {
      lineGroupId,
      slackChannelId,
    },
  });
}

/**
 * PairingのチャネルIDを取得
 */
export async function getPairingByChannel(lineGroupId?: string, slackChannelId?: string) {
  if (lineGroupId) {
    return prisma.pairing.findFirst({
      where: { lineGroupId, status: 'ACTIVE', deletedAt: null },
      include: {
        student: true,
        tutor: true,
      },
    });
  }

  if (slackChannelId) {
    return prisma.pairing.findFirst({
      where: { slackChannelId, status: 'ACTIVE', deletedAt: null },
      include: {
        student: true,
        tutor: true,
      },
    });
  }

  return null;
}
