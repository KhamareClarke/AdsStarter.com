import { FB_GRAPH_BASE, FB_SCOPES, getFacebookRedirectUri } from './constants';
import { facebookGet } from './client';

export function buildFacebookAuthUrl(state: string) {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) throw new Error('FACEBOOK_APP_ID is not configured');

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getFacebookRedirectUri(),
    state,
    scope: FB_SCOPES,
    response_type: 'code',
  });

  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in?: number;
}> {
  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;

  const url = new URL(`${FB_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('redirect_uri', getFacebookRedirectUri());
  url.searchParams.set('code', code);

  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json;
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string;
  expires_in?: number;
}> {
  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;

  const url = new URL(`${FB_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('fb_exchange_token', shortLivedToken);

  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json;
}

export async function refreshAccessToken(currentToken: string) {
  return exchangeForLongLivedToken(currentToken);
}

export interface FacebookAdAccount {
  id: string;
  name: string;
  account_status?: number;
}

export async function fetchAdAccounts(accessToken: string): Promise<FacebookAdAccount[]> {
  const result = await facebookGet<{ data: FacebookAdAccount[] }>(
    '/me/adaccounts',
    accessToken,
    { fields: 'id,name,account_status', limit: '100' }
  );
  return result.data ?? [];
}

export async function getAccessTokenForUser(userId: string, accountId: string) {
  const { getAdAccountsByPlatform, getDecryptedAccessToken } = await import('@/lib/integrations/accounts');
  const accounts = await getAdAccountsByPlatform(userId, 'facebook');
  const account = accounts.find((a) => a.id === accountId || a.external_account_id === accountId);
  if (!account) throw new Error('Facebook ad account not found');
  return { account, token: await getDecryptedAccessToken(account) };
}
