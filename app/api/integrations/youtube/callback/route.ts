import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode, listAccessibleCustomers } from '@/lib/integrations/google/oauth';
import { upsertAdAccount } from '@/lib/integrations/accounts';
import { consumeOAuthStateCookie } from '@/lib/integrations/oauth-state';

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=missing_code`);
  }

  const oauthState = await consumeOAuthStateCookie<{
    state: string;
    userId: string;
    returnTo: string;
  }>('youtube', state);

  if (!oauthState) {
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=invalid_state`);
  }

  try {
    const tokens = await exchangeGoogleCode(code, 'youtube');
    const expiry = new Date(Date.now() + tokens.expires_in * 1000);

    let customers: string[] = [];
    try {
      customers = await listAccessibleCustomers(tokens.access_token);
    } catch {
      customers = ['pending-setup'];
    }

    for (const resource of customers) {
      const customerId = resource.replace('customers/', '');
      await upsertAdAccount({
        userId: oauthState.userId,
        platform: 'youtube',
        accountName: `YouTube Ads ${customerId}`,
        externalAccountId: customerId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiry: expiry,
        metadata: { channel_type: 'VIDEO' },
      });
    }

    return NextResponse.redirect(
      `${appUrl()}${oauthState.returnTo}?connected=youtube&accounts=${customers.length}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'oauth_failed';
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=${encodeURIComponent(msg)}`);
  }
}
