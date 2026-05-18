import { TIKTOK_API_BASE, TIKTOK_AUTH_URL, getTikTokRedirectUri } from './constants';

export function buildTikTokAuthUrl(state: string) {
  const appId = process.env.TIKTOK_APP_ID;
  if (!appId) throw new Error('TIKTOK_APP_ID is not configured');

  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: getTikTokRedirectUri(),
    state,
  });

  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeTikTokCode(authCode: string) {
  const res = await fetch(`${TIKTOK_API_BASE}/oauth2/access_token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID,
      secret: process.env.TIKTOK_APP_SECRET,
      auth_code: authCode,
    }),
  });

  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message ?? 'TikTok token exchange failed');
  return json.data as {
    access_token: string;
    refresh_token?: string;
    advertiser_ids?: string[];
  };
}

export async function getCampaigns(accessToken: string, advertiserId: string) {
  const url = new URL(`${TIKTOK_API_BASE}/campaign/get/`);
  url.searchParams.set('advertiser_id', advertiserId);

  const listRes = await fetch(url.toString(), {
    headers: { 'Access-Token': accessToken },
  });
  const json = await listRes.json();
  if (json.code !== 0) throw new Error(json.message);
  return json.data?.list ?? [];
}
