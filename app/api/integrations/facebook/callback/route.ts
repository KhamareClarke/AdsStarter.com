import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchAdAccounts,
} from '@/lib/integrations/facebook/oauth';
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
  }>('facebook', state);

  if (!oauthState) {
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=invalid_state`);
  }

  try {
    const short = await exchangeCodeForToken(code);
    const long = await exchangeForLongLivedToken(short.access_token);
    const expiry = long.expires_in
      ? new Date(Date.now() + long.expires_in * 1000)
      : undefined;

    const adAccounts = await fetchAdAccounts(long.access_token);

    if (adAccounts.length === 0) {
      return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=no_ad_accounts`);
    }

    for (const act of adAccounts) {
      const externalId = act.id.replace('act_', '');
      await upsertAdAccount({
        userId: oauthState.userId,
        platform: 'facebook',
        accountName: act.name ?? `Facebook ${externalId}`,
        externalAccountId: externalId,
        accessToken: long.access_token,
        accessTokenExpiry: expiry,
        metadata: { account_status: act.account_status },
      });
    }

    const supabase = createAdminSupabase();
    await supabase.from('integrations').upsert(
      {
        user_id: oauthState.userId,
        service: 'facebook',
        status: 'connected',
        last_synced: new Date().toISOString(),
      },
      { onConflict: 'user_id,service' }
    );

    return NextResponse.redirect(
      `${appUrl()}${oauthState.returnTo}?connected=facebook&accounts=${adAccounts.length}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'oauth_failed';
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=${encodeURIComponent(msg)}`);
  }
}
