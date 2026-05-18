import { createEmailTransporter } from './email-transport.mjs';

const user = process.env.EMAIL_USER?.trim();
const to = process.argv[2] ?? 'fizasaif0233@gmail.com';

if (!user) {
  console.error('EMAIL_USER and EMAIL_PASS required in .env.local');
  process.exit(1);
}

const transporter = createEmailTransporter();

const html = `
<div style="font-family:Arial,sans-serif;max-width:600px">
  <motionDiv style="background:linear-gradient(135deg,#00c6ff,#0072ff);padding:24px;border-radius:8px 8px 0 0">
    <h1 style="color:white;margin:0">AdsStarter</h1>
  </motionDiv>
  <div style="padding:24px;border:1px solid #e5e7eb">
    <p>Hi — this email was sent <strong>directly via Gmail</strong>.</p>
    <p>GHL accepted your test email as <em>queued</em> but it often won't arrive until you configure <strong>LC Email</strong> or a custom domain in Go High Level → Settings → Email Services.</p>
    <p>Your SMS test worked. Check spam for any GHL emails too.</p>
    <p><a href="https://adsstarter.com/dashboard">Open Dashboard</a></p>
  </div>
</motionDiv>`.replace(/motionDiv/g, 'div');

const info = await transporter.sendMail({
  from: `"AdsStarter" <${user}>`,
  to,
  subject: 'AdsStarter — Test email (via IONOS)',
  html,
});

console.log('Sent:', info.messageId, 'to', to);
