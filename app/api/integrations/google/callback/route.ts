import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode, listAccessibleCustomers } from '@/lib/integrations/google/oauth';
import { upsertAdAccount } from '@/lib/integrations/accounts';
import { consumeOAuthStateCookie } from '@/lib/integrations/oauth-state';
import { createAdminSupabase } from '@/lib/supabase/admin';

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=missing_code`);
  }

  const oauthState = await consumeOAuthStateCookie<{
    state: string;
    userId: string;
    returnTo: string;
  }>('google', state);

  if (!oauthState) {
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=invalid_state`);
  }

  try {
    const tokens = await exchangeGoogleCode(code, 'google');
    const expiry = new Date(Date.now() + tokens.expires_in * 1000);

    let customers: string[] = [];
    try {
      customers = await listAccessibleCustomers(tokens.access_token);
    } catch {
      // Developer token may not be set yet — store single placeholder account
      customers = ['pending-setup'];
    }

    for (const resource of customers) {
      const customerId = resource.replace('customers/', '');
      await upsertAdAccount({
        userId: oauthState.userId,
        platform: 'google',
        accountName: `Google Ads ${customerId}`,
        externalAccountId: customerId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiry: expiry,
      });
    }

    const supabase = createAdminSupabase();
    await supabase.from('integrations').upsert(
      {
        user_id: oauthState.userId,
        service: 'google',
        status: 'connected',
        last_synced: new Date().toISOString(),
      },
      { onConflict: 'user_id,service' }
    );

    return NextResponse.redirect(
      `${appUrl()}${oauthState.returnTo}?connected=google&accounts=${customers.length}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'oauth_failed';
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=${encodeURIComponent(msg)}`);
  }
}
