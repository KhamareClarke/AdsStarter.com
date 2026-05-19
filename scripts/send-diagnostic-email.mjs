/**
 * Diagnostic send — plain text + HTML, logs full SMTP response.
 * Usage: node --env-file=.env.local scripts/send-diagnostic-email.mjs you@example.com
 */
import { createEmailTransporter } from './email-transport.mjs';

const to = process.argv[2];
if (!to) {
  console.error('Usage: node --env-file=.env.local scripts/send-diagnostic-email.mjs recipient@email.com');
  process.exit(1);
}

const from = process.env.EMAIL_USER?.trim();
const host = process.env.EMAIL_SMTP_HOST?.trim() || 'smtp.ionos.co.uk';
const port = process.env.EMAIL_SMTP_PORT ?? 587;

console.log('From:', from);
console.log('SMTP:', `${host}:${port}`);
console.log('To:', to);

const transporter = createEmailTransporter();

const info = await transporter.sendMail({
  from: `"AdsStarter" <${from}>`,
  to,
  replyTo: from,
  subject: `AdsStarter test ${new Date().toISOString().slice(0, 19)}`,
  text: `This is a plain-text test from AdsStarter via IONOS (${host}).

If you see this, SMTP delivery worked. Time: ${new Date().toISOString()}`,
  html: `<p>This is an <strong>HTML test</strong> from AdsStarter via IONOS (<code>${host}</code>).</p><p>Time: ${new Date().toISOString()}</p>`,
  headers: {
    'X-AdsStarter-Test': 'diagnostic',
  },
});

console.log('\nSMTP accepted the message:');
console.log('  messageId:', info.messageId);
console.log('  response:', info.response);
console.log('  accepted:', info.accepted);
console.log('  rejected:', info.rejected);
console.log('\nIf inbox is empty: check Spam, Promotions, and IONOS webmail Sent folder.');
console.log('Gmail often blocks new domains until SPF/DKIM are set in IONOS DNS.');
