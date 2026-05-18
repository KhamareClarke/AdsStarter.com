/**
 * Send AdsStarter test email to one or more addresses via GHL or Gmail.
 * Usage: node --env-file=.env.local scripts/send-test-emails.mjs addr1@x.com addr2@y.com
 */
import { createEmailTransporter } from './email-transport.mjs';

const GHL_BASE = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

const recipients = process.argv.slice(2);
if (recipients.length === 0) {
  console.error('Usage: node --env-file=.env.local scripts/send-test-emails.mjs email1 [email2 ...]');
  process.exit(1);
}

const html = `
<div style="font-family:Arial,sans-serif;max-width:600px">
  <motionDiv style="background:linear-gradient(135deg,#00c6ff,#0072ff);padding:24px;border-radius:8px 8px 0 0">
    <h1 style="color:white;margin:0">AdsStarter</h1>
  </motionDiv>
  <div style="padding:24px;border:1px solid #e5e7eb">
    <p>Hi — this is a <strong>test email</strong> from AdsStarter.</p>
    <p>If you received this, your email integration is working.</p>
    <p><a href="https://adsstarter.com/dashboard">Open Dashboard</a></p>
  </div>
</motionDiv>`.replace(/motionDiv/g, 'motion');

const htmlFixed = html.replace(/motion/g, 'div');

async function sendViaSmtp(to) {
  const user = process.env.EMAIL_USER?.trim();
  if (!user) return { ok: false, error: 'EMAIL_USER not set' };

  const transporter = createEmailTransporter();
  const info = await transporter.sendMail({
    from: `"AdsStarter" <${user}>`,
    to,
    subject: 'AdsStarter — Test email',
    html: htmlFixed,
  });
  return { ok: true, messageId: info.messageId, via: 'ionos' };
}

async function ghlRequest(apiKey, method, path, body) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: VERSION,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(json.message ?? res.statusText);
    err.status = res.status;
    err.json = json;
    throw err;
  }
  return json;
}

async function sendViaGhl(to) {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey || !locationId) return { ok: false, error: 'GHL_API_KEY/GHL_LOCATION_ID not set' };

  let contactId;
  try {
    const created = await ghlRequest(apiKey, 'POST', '/contacts/', {
      locationId,
      firstName: 'AdsStarter',
      lastName: 'Test',
      email: to,
      tags: ['adsstarter_test'],
      source: 'AdsStarter Test Email',
    });
    contactId = created.contact?.id ?? created.id;
  } catch (e) {
    const dupId = e.json?.meta?.contactId;
    if (dupId) contactId = dupId;
    else throw e;
  }

  const mail = await ghlRequest(apiKey, 'POST', '/conversations/messages', {
    locationId,
    type: 'Email',
    contactId,
    subject: 'AdsStarter — Test email',
    message: 'This is a test email from AdsStarter. Check your dashboard for campaign updates.',
    html: htmlFixed,
    emailTo: to,
  });

  return {
    ok: true,
    via: 'ghl',
    contactId,
    messageId: mail.messageId ?? mail.id ?? null,
    status: mail.msg ?? mail.status ?? 'queued',
  };
}

for (const to of recipients) {
  console.log(`\n→ ${to}`);
  try {
    let result;
    try {
      result = await sendViaSmtp(to);
      if (!result.ok) throw new Error(result.error);
    } catch (smtpErr) {
      console.log('  IONOS SMTP failed:', smtpErr.message?.slice(0, 100) ?? smtpErr);
      console.log('  Trying GHL...');
      result = await sendViaGhl(to);
    }
    console.log(`  Sent via ${result.via}`, result.messageId ? `(${result.messageId})` : '');
    if (result.status) console.log('  Status:', result.status);
  } catch (e) {
    console.error('  Error:', e.message);
    if (e.json) console.error(JSON.stringify(e.json, null, 2));
  }
}
