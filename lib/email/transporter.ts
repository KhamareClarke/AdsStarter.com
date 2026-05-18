import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';

/** IONOS (and other SMTP) — set EMAIL_USER, EMAIL_PASS; optional EMAIL_SMTP_HOST/PORT. */
export function createEmailTransporter(): Transporter {
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

export function getEmailFromAddress(): string {
  return process.env.EMAIL_USER?.trim() || 'noreply@adsstarter.com';
}
