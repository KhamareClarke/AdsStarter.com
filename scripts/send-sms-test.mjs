/**
 * Send test SMS via GHL to a contact (by email lookup or TEST_PHONE).
 * Usage: node --env-file=.env.local scripts/send-sms-test.mjs [email] [phone]
 */
const GHL_BASE = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;
const email = process.argv[2] ?? 'fizasaif0233@gmail.com';
const phoneArg = process.argv[3] ?? process.env.TEST_PHONE;

if (!apiKey || !locationId) {
  console.error('Missing GHL_API_KEY or GHL_LOCATION_ID in .env.local');
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

async function findContactByEmail(targetEmail) {
  const q = encodeURIComponent(targetEmail);
  const data = await ghl('GET', `/contacts/?locationId=${locationId}&query=${q}`);
  const contacts = data.contacts ?? data.contact ?? [];
  const list = Array.isArray(contacts) ? contacts : [contacts].filter(Boolean);
  return list.find((c) => c.email?.toLowerCase() === targetEmail.toLowerCase()) ?? list[0];
}

async function main() {
  console.log('Looking up contact:', email);
  let contact = await findContactByEmail(email);
  let contactId = contact?.id;
  let phone = phoneArg || contact?.phone;

  if (!contactId) {
    if (!phone) {
      console.error('No contact found and no phone provided.');
      console.error('Usage: node --env-file=.env.local scripts/send-sms-test.mjs email@x.com +1234567890');
      process.exit(1);
    }
    console.log('Creating contact with phone', phone);
    const created = await ghl('POST', '/contacts/', {
      firstName: 'AdsStarter',
      lastName: 'Test',
      email,
      phone,
      tags: ['adsstarter_test'],
    });
    contactId = created.contact?.id ?? created.id;
  } else if (!phone) {
    console.error('Contact found but has no phone number. Pass phone as 2nd argument.');
    process.exit(1);
  }

  console.log('Contact ID:', contactId);
  console.log('Sending SMS to:', phone);

  const smsBody =
    '🚀 AdsStarter test SMS — your GHL integration is working. Campaign alerts will arrive here.';

  const sms = await ghl('POST', '/conversations/messages', {
    type: 'SMS',
    contactId,
    message: smsBody,
  });

  console.log('SMS result:', JSON.stringify(sms, null, 2));
  console.log('\nSMS cannot be sent to an email address — it was sent to the phone number above.');
  console.log('Check the phone for the message (GHL may need a valid SMS number on file).');
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
