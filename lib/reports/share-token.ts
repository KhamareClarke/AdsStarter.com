import { createHmac, timingSafeEqual } from 'crypto';

function getSecret() {
  return (
    process.env.REPORT_SHARE_SECRET ||
    process.env.CRON_SECRET ||
    process.env.INTEGRATION_ENCRYPTION_KEY ||
    'adsstarter-dev-share'
  );
}

export function createReportShareToken(campaignId: string, userId: string): string {
  return createHmac('sha256', getSecret())
    .update(`${campaignId}:${userId}`)
    .digest('hex')
    .slice(0, 32);
}

export function verifyReportShareToken(
  campaignId: string,
  userId: string,
  token: string
): boolean {
  const expected = createReportShareToken(campaignId, userId);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
