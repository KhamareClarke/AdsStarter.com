import {
  GOOGLE_ADS_API,
  GOOGLE_ADS_SCOPES,
  GOOGLE_AUTH_URL,
  GOOGLE_TOKEN_URL,
  YOUTUBE_ADS_SCOPES,
  getGoogleRedirectUri,
} from './constants';

export function buildGoogleAuthUrl(state: string, platform: 'google' | 'youtube' = 'google') {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not configured');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(platform),
    response_type: 'code',
    scope: platform === 'youtube' ? YOUTUBE_ADS_SCOPES : GOOGLE_ADS_SCOPES,
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string, platform: 'google' | 'youtube' = 'google') {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getGoogleRedirectUri(platform),
      grant_type: 'authorization_code',
    }),
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error_description ?? json.error);
  return json as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error_description ?? json.error);
  return json as { access_token: string; expires_in: number };
}

export async function listAccessibleCustomers(accessToken: string) {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured');

  const res = await fetch(`${GOOGLE_ADS_API}/customers:listAccessibleCustomers`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken,
    },
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return (json.resourceNames ?? []) as string[];
}

export async function searchGoogleAds<T>(
  accessToken: string,
  customerId: string,
  query: string
): Promise<T[]> {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured');

  const customer = customerId.replace('customers/', '');
  const res = await fetch(`${GOOGLE_ADS_API}/customers/${customer}/googleAds:search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.results ?? [];
}
