/**
 * メッセージングサービス
 * 学生（LINE）↔ チューター（Slack）間のメッセージングを管理
 */

import { prisma } from '@/lib/prisma';
import { sendLineMessage } from '@/lib/line-client';
import { sendStudentMessageToTutor, openSlackDM, sendSlackMessage } from '@/lib/slack-client';

export interface MessagePayload {
  senderType: 'STUDENT' | 'TUTOR';
  senderId: string;
  content: string;
  externalId?: string;
  threadId?: string;
}

/**
 * 学生からチューターへメッセージを送信
 */
export async function sendMessageFromStudent(
  lineUserId: string,
  message: string,
  lineMessageId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. LINE User ID から Student を特定
    const externalAccount = await prisma.externalAccount.findFirst({
      where: {
        provider: 'LINE',
        externalId: lineUserId,
        userType: 'STUDENT',
        isActive: true,
      },
    });

    if (!externalAccount || externalAccount.userType !== 'STUDENT') {
      console.error('[Messaging] Student not found for LINE user:', lineUserId);
      return { success: false, error: 'Student not found' };
    }

    // 2. Student のアクティブなペアリングを取得
    const pairing = await prisma.pairing.findFirst({
      where: {
        studentId: externalAccount.userId,
        status: 'ACTIVE',
      },
      include: {
        student: true,
        tutor: true,
      },
    });

    if (!pairing) {
      console.error('[Messaging] No active pairing found for student:', externalAccount.userId);
      return { success: false, error: 'No active pairing found' };
    }

    // 3. Tutor の Slack アカウントを取得
    const tutorSlackAccount = await prisma.externalAccount.findFirst({
      where: {
        userId: pairing.tutorId,
        userType: 'TUTOR',
        provider: 'SLACK',
        isActive: true,
      },
    });

    if (!tutorSlackAccount) {
      console.error('[Messaging] Tutor Slack account not found for tutor:', pairing.tutorId);
      return { success: false, error: 'Tutor Slack account not found' };
    }

    // 4. チューターにSlackでメッセージ送信
    const studentName = `${pairing.student.lastName} ${pairing.student.firstName}`;
    const slackResult = await sendStudentMessageToTutor(
      tutorSlackAccount.channelId || tutorSlackAccount.externalId,
      studentName,
      message
    );

    if (!slackResult.success) {
      console.error('[Messaging] Failed to send Slack message:', slackResult.error);
      return { success: false, error: 'Failed to send Slack message' };
    }

    // 5. メッセージ履歴をDBに保存
    await prisma.message.create({
      data: {
        pairingId: pairing.id,
        senderId: externalAccount.userId,
        senderType: 'STUDENT',
        content: message,
        messageType: 'TEXT',
        status: 'SENT',
        externalId: lineMessageId,
        threadId: slackResult.ts, // Slack message timestamp
      },
    });

    console.log('[Messaging] Student message sent successfully');
    return { success: true };
  } catch (error) {
    console.error('[Messaging] Error sending message from student:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * チューターから学生へメッセージを送信
 */
export async function sendMessageFromTutor(
  slackUserId: string,
  message: string,
  slackMessageId?: string,
  threadId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Slack User ID から Tutor を特定
    const externalAccount = await prisma.externalAccount.findFirst({
      where: {
        provider: 'SLACK',
        externalId: slackUserId,
        userType: 'TUTOR',
        isActive: true,
      },
    });

    if (!externalAccount || externalAccount.userType !== 'TUTOR') {
      console.error('[Messaging] Tutor not found for Slack user:', slackUserId);
      return { success: false, error: 'Tutor not found' };
    }

    // 2. スレッドIDから対象のメッセージとペアリングを特定
    let pairing;
    if (threadId) {
      const originalMessage = await prisma.message.findFirst({
        where: {
          threadId: threadId,
        },
        include: {
          pairing: {
            include: {
              student: true,
              tutor: true,
            },
          },
        },
      });

      if (originalMessage) {
        pairing = originalMessage.pairing;
      }
    }

    // スレッドIDで特定できない場合は、アクティブなペアリングを取得
    if (!pairing) {
      pairing = await prisma.pairing.findFirst({
        where: {
          tutorId: externalAccount.userId,
          status: 'ACTIVE',
        },
        include: {
          student: true,
          tutor: true,
        },
      });
    }

    if (!pairing) {
      console.error('[Messaging] No active pairing found for tutor:', externalAccount.userId);
      return { success: false, error: 'No active pairing found' };
    }

    // 3. Student の LINE アカウントを取得
    const studentLineAccount = await prisma.externalAccount.findFirst({
      where: {
        userId: pairing.studentId,
        userType: 'STUDENT',
        provider: 'LINE',
        isActive: true,
      },
    });

    if (!studentLineAccount) {
      console.error('[Messaging] Student LINE account not found for student:', pairing.studentId);
      return { success: false, error: 'Student LINE account not found' };
    }

    // 4. 学生にLINEでメッセージ送信
    const lineResult = await sendLineMessage(studentLineAccount.externalId, message);

    if (!lineResult) {
      console.error('[Messaging] Failed to send LINE message');
      return { success: false, error: 'Failed to send LINE message' };
    }

    // 5. メッセージ履歴をDBに保存
    await prisma.message.create({
      data: {
        pairingId: pairing.id,
        senderId: externalAccount.userId,
        senderType: 'TUTOR',
        content: message,
        messageType: 'TEXT',
        status: 'SENT',
        externalId: slackMessageId,
        threadId: threadId,
      },
    });

    console.log('[Messaging] Tutor message sent successfully');
    return { success: true };
  } catch (error) {
    console.error('[Messaging] Error sending message from tutor:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * ペアリング用のSlackチャンネルまたはDMを作成
 */
export async function createTutorMessagingChannel(
  tutorId: string,
  studentId: string
): Promise<{ success: boolean; channelId?: string; error?: string }> {
  try {
    // Tutor の Slack アカウントを取得
    const tutorSlackAccount = await prisma.externalAccount.findFirst({
      where: {
        userId: tutorId,
        userType: 'TUTOR',
        provider: 'SLACK',
        isActive: true,
      },
    });

    if (!tutorSlackAccount) {
      return { success: false, error: 'Tutor Slack account not found' };
    }

    // DM チャンネルを開く
    const channelId = await openSlackDM(tutorSlackAccount.externalId);

    if (!channelId) {
      return { success: false, error: 'Failed to open Slack DM' };
    }

    // ExternalAccount にチャンネルIDを保存
    await prisma.externalAccount.update({
      where: {
        id: tutorSlackAccount.id,
      },
      data: {
        channelId: channelId,
      },
    });

    // 初期メッセージを送信
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (student) {
      const welcomeMessage = `🎓 新しい学生とのペアリングが開始されました！

**学生**: ${student.lastName} ${student.firstName}さん
**連絡方法**: この Slack チャンネルで学生とLINEを通じてやり取りできます

学生からメッセージが届くとここに通知されます。返信すると学生のLINEに送信されます。`;

      await sendSlackMessage(channelId, welcomeMessage);
    }

    return { success: true, channelId };
  } catch (error) {
    console.error('[Messaging] Error creating tutor messaging channel:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * メッセージ履歴を取得
 */
export async function getMessageHistory(
  pairingId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    const messages = await prisma.message.findMany({
      where: {
        pairingId: pairingId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        pairing: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true },
            },
            tutor: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return messages;
  } catch (error) {
    console.error('[Messaging] Error getting message history:', error);
    return [];
  }
}