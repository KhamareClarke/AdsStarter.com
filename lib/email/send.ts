import { AppError } from '@/lib/error-handler';
import { createEmailTransporter, getEmailFromAddress } from '@/lib/email/transporter';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/** Send email via IONOS SMTP (EMAIL_USER / EMAIL_SMTP_*). */
export async function sendEmail(options: SendEmailOptions) {
  let transporter;
  try {
    transporter = createEmailTransporter();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Email not configured';
    throw new AppError(msg, 503, 'Email is not configured on the server. Please contact support.');
  }
  const from = getEmailFromAddress();

  try {
    return await transporter.sendMail({
    from: `"AdsStarter" <${from}>`,
    to: options.to,
    replyTo: options.replyTo ?? from,
    subject: options.subject,
    html: options.html,
    text: options.text,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send email';
    throw new AppError(msg, 503, 'Could not send email. Please try again in a few minutes.');
  }
}
