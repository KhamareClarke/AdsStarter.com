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
  const transporter = createEmailTransporter();
  const from = getEmailFromAddress();

  return transporter.sendMail({
    from: `"AdsStarter" <${from}>`,
    to: options.to,
    replyTo: options.replyTo ?? from,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
