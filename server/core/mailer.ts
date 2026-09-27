import Mailjet from 'node-mailjet';
import { getSettings } from './dataStore.js';

function getMailjetClient() {
  const settings = getSettings();
  return Mailjet.apiConnect(
    settings.mailjetApiKey || '4898b704c0e9979a617c01327b2c5485',
    settings.mailjetSecretKey || '94b374b7f2a3b7fa7f0bfed91d6d81ad'
  );
}

export interface SendEmailParams {
  toEmail: string;
  toName: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  const settings = getSettings();
  const fromEmail = settings.fromEmail || settings.email;
  const fromName = settings.fromName || 'Credit Acceleration Team';

  if (!fromEmail) {
    console.warn('[Mailer] No fromEmail configured – email skipped, logging instead.');
    console.log(`[EMAIL PREVIEW]\nTo: ${params.toEmail}\nSubject: ${params.subject}\n---\n${params.textBody || params.htmlBody}`);
    return { success: true, messageId: 'PREVIEW_MODE' };
  }

  try {
    const mj = getMailjetClient();
    const result = await mj.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: { Email: fromEmail, Name: fromName },
          To: [{ Email: params.toEmail, Name: params.toName }],
          Subject: params.subject,
          TextPart: params.textBody || stripHtml(params.htmlBody),
          HTMLPart: params.htmlBody,
        },
      ],
    });

    const body = result.body as any;
    const msgId = body?.Messages?.[0]?.To?.[0]?.MessageID?.toString() ?? 'unknown';
    console.log(`[Mailer] ✅ Sent to ${params.toEmail} | MJ ID: ${msgId}`);
    return { success: true, messageId: msgId };
  } catch (err: any) {
    console.error('[Mailer] ❌ Send failed:', err?.message);
    return { success: false, error: err?.message ?? 'Unknown error' };
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
