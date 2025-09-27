/**
 * Slack通知ユーティリティ
 */

interface SlackMessage {
  text: string;
  blocks?: any[];
}

/**
 * Slackにメッセージを送信
 */
export async function sendSlackNotification(message: string | SlackMessage): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[Slack] Webhook URL not configured, skipping notification');
    return false;
  }

  try {
    const payload = typeof message === 'string' ? { text: message } : message;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }

    console.log('[Slack] Notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Slack] Failed to send notification:', error);
    return false;
  }
}

/**
 * チューター登録通知
 */
export async function notifyTutorRegistration(tutorData: {
  name: string;
  email: string;
  specialties?: string[];
  affiliation?: string;
}) {
  const specialtiesText = tutorData.specialties?.length
    ? `専門分野: ${tutorData.specialties.join(', ')}`
    : '';

  const affiliationText = tutorData.affiliation
    ? `所属: ${tutorData.affiliation}`
    : '';

  const message = {
    text: "新しいチューターが登録されました",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎓 新しいチューター登録"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*名前:*\n${tutorData.name}`
          },
          {
            type: "mrkdwn",
            text: `*メール:*\n${tutorData.email}`
          }
        ]
      }
    ]
  };

  // 専門分野や所属があれば追加
  if (specialtiesText || affiliationText) {
    const additionalFields = [];
    if (specialtiesText) {
      additionalFields.push({
        type: "mrkdwn",
        text: `*専門分野:*\n${tutorData.specialties?.join(', ')}`
      });
    }
    if (affiliationText) {
      additionalFields.push({
        type: "mrkdwn",
        text: `*所属:*\n${tutorData.affiliation}`
      });
    }

    message.blocks.push({
      type: "section",
      fields: additionalFields
    });
  }

  return await sendSlackNotification(message);
}

/**
 * 参加者（生徒）登録通知
 */
export async function notifyStudentRegistration(studentData: {
  name: string;
  email: string;
  parentName?: string;
  interests?: string[];
  grade?: string;
}) {
  const interestsText = studentData.interests?.length
    ? studentData.interests.join(', ')
    : '未設定';

  const message = {
    text: "新しい参加者が登録されました",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📚 新しい参加者登録"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*参加者名:*\n${studentData.name}`
          },
          {
            type: "mrkdwn",
            text: `*メール:*\n${studentData.email}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*興味のある分野:*\n${interestsText}`
          }
        ]
      }
    ]
  };

  // 保護者名があれば追加
  if (studentData.parentName && message.blocks[2] && 'fields' in message.blocks[2]) {
    (message.blocks[2] as any).fields.push({
      type: "mrkdwn",
      text: `*保護者名:*\n${studentData.parentName}`
    });
  }

  // 学年があれば追加
  if (studentData.grade && message.blocks[2] && 'fields' in message.blocks[2]) {
    (message.blocks[2] as any).fields.push({
      type: "mrkdwn",
      text: `*学年:*\n${studentData.grade}`
    });
  }

  return await sendSlackNotification(message);
}

/**
 * 汎用通知（その他のイベント用）
 */
export async function notifyGeneral(title: string, details: Record<string, string>) {
  const fields = Object.entries(details).map(([key, value]) => ({
    type: "mrkdwn",
    text: `*${key}:*\n${value}`
  }));

  const message = {
    text: title,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: title
        }
      },
      {
        type: "section",
        fields
      }
    ]
  };

  return await sendSlackNotification(message);
}