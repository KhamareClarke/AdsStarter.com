import { NextRequest, NextResponse } from 'next/server';
import { exchangeTikTokCode } from '@/lib/integrations/tiktok/oauth';
import { upsertAdAccount } from '@/lib/integrations/accounts';
import { consumeOAuthStateCookie } from '@/lib/integrations/oauth-state';
import { createAdminSupabase } from '@/lib/supabase/admin';

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authCode = searchParams.get('auth_code') ?? searchParams.get('code');
  const state = searchParams.get('state');

  if (!authCode || !state) {
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=missing_code`);
  }

  const oauthState = await consumeOAuthStateCookie<{
    state: string;
    userId: string;
    returnTo: string;
  }>('tiktok', state);

  if (!oauthState) {
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=invalid_state`);
  }

  try {
    const data = await exchangeTikTokCode(authCode);
    const advertiserIds = data.advertiser_ids ?? [];

    if (advertiserIds.length === 0) {
      return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=no_tiktok_accounts`);
    }

    for (const advertiserId of advertiserIds) {
      await upsertAdAccount({
        userId: oauthState.userId,
        platform: 'tiktok',
        accountName: `TikTok ${advertiserId}`,
        externalAccountId: advertiserId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
    }

    const supabase = createAdminSupabase();
    await supabase.from('integrations').upsert(
      {
        user_id: oauthState.userId,
        service: 'tiktok',
        status: 'connected',
        last_synced: new Date().toISOString(),
      },
      { onConflict: 'user_id,service' }
    );

    return NextResponse.redirect(
      `${appUrl()}${oauthState.returnTo}?connected=tiktok&accounts=${advertiserIds.length}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'oauth_failed';
    return NextResponse.redirect(`${appUrl()}/dashboard/accounts?error=${encodeURIComponent(msg)}`);
  }
}
