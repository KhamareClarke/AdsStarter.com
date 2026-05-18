export const TIKTOK_AUTH_URL = 'https://business-api.tiktok.com/portal/auth';
export const TIKTOK_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

export const TIKTOK_SCOPES = ['ads.management', 'ads.report'].join(',');

export function getTikTokRedirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/integrations/tiktok/callback`;
}
