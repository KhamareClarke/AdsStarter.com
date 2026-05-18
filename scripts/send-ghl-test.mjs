const GHL_BASE = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;
const phone = process.env.TEST_PHONE ?? '+447473255886';
const email = process.env.TEST_EMAIL ?? 'fizasaif0233@gmail.com';

if (!apiKey || !locationId) {
  console.error('Missing GHL_API_KEY or GHL_LOCATION_ID');
  process.exit(1);
}

async function ghl(method, path, body, opts = {}) {
  const payload = body
    ? opts.noLocation
      ? body
      : { ...body, locationId: body.locationId ?? locationId }
    : undefined;
  const res = await fetch(`${GHL_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: VERSION,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(JSON.stringify({ status: res.status, ...json }, null, 2));
  }
  return json;
}

async function main() {
  let contactId;

  try {
    console.log('Creating GHL contact...');
    const created = await ghl('POST', '/contacts/', {
      firstName: 'AdsStarter',
      lastName: 'Test',
      email,
      phone,
      tags: ['adsstarter_user', 'test_message'],
      source: 'AdsStarter Test',
    });
    contactId = created.contact?.id ?? created.id;
  } catch (e) {
    const parsed = JSON.parse(e.message);
    if (parsed.meta?.contactId) {
      contactId = parsed.meta.contactId;
      console.log('Using existing contact:', contactId);
      console.log('Updating phone on contact...');
      await ghl(
        'PUT',
        `/contacts/${contactId}`,
        { phone, email },
        { noLocation: true }
      );
    } else {
      throw e;
    }
  }

  if (!contactId) {
    console.error('No contact ID');
    process.exit(1);
  }
  console.log('Contact ID:', contactId);

  const smsBody =
    '🚀 AdsStarter test SMS — your GHL integration is working. Campaign alerts will arrive here.';

  console.log('Sending SMS to', phone, '...');
  const sms = await ghl('POST', '/conversations/messages', {
    type: 'SMS',
    contactId,
    message: smsBody,
  });
  console.log('SMS result:', JSON.stringify(sms, null, 2));

  const html = `
    <motionDiv style="font-family:Arial,sans-serif;max-width:600px;">
      <h2 style="color:#0072ff;">AdsStarter — Test Email</h2>
      <p>Your Go High Level email integration is working.</p>
      <p>You will receive campaign alerts, daily reports, and optimization tips here.</p>
      <p><a href="https://adsstarter.com/dashboard">Open Dashboard</a></p>
    </div>`.replace(/motionDiv/g, 'div');

  console.log('Sending email to', email, '...');
  const mail = await ghl('POST', '/conversations/messages', {
    type: 'Email',
    contactId,
    subject: 'AdsStarter — GHL test email',
    message: 'Your Go High Level email integration is working. Campaign alerts will arrive here.',
    html,
  });
  console.log('Email result:', JSON.stringify(mail, null, 2));

  console.log('\nDone — check phone and inbox (and spam).');
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
