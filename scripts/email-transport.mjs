import nodemailer from 'nodemailer';

/** IONOS SMTP (smtp.ionos.com:587 STARTTLS). Override with EMAIL_SMTP_* env vars. */
export function createEmailTransporter() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/^"|"$/g, '').trim();
  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASS are required');
  }

  const host = process.env.EMAIL_SMTP_HOST?.trim() || 'smtp.ionos.co.uk';
  const port = Number(process.env.EMAIL_SMTP_PORT ?? 587);
  const secure = process.env.EMAIL_SMTP_SECURE !== 'false' && port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: port === 587,
    tls: { minVersion: 'TLSv1.2' },
  });
}
