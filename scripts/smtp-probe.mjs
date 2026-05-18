import nodemailer from 'nodemailer';

const user = process.env.EMAIL_USER?.trim();
const pass = process.env.EMAIL_PASS?.replace(/^"|"$/g, '').trim();
if (!user || !pass) {
  console.error('EMAIL_USER and EMAIL_PASS required');
  process.exit(1);
}

const configs = [
  { host: 'smtp.ionos.com', port: 587, secure: false },
  { host: 'smtp.ionos.com', port: 465, secure: true },
  { host: 'smtp.ionos.co.uk', port: 587, secure: false },
  { host: 'smtp.ionos.co.uk', port: 465, secure: true },
];

for (const { host, port, secure } of configs) {
  const t = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: port === 587,
    tls: { minVersion: 'TLSv1.2' },
  });
  try {
    await t.verify();
    console.log(`OK  ${host}:${port} secure=${secure}`);
  } catch (e) {
    console.log(`FAIL ${host}:${port} - ${e.message.split('\n')[0].slice(0, 100)}`);
  }
}
