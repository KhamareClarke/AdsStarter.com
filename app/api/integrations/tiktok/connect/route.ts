import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildTikTokAuthUrl } from '@/lib/integrations/tiktok/oauth';
import { createOAuthState, setOAuthStateCookie } from '@/lib/integrations/oauth-state';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
  }

  const { state, payload } = createOAuthState('tiktok', user.id);
  await setOAuthStateCookie('tiktok', payload);
  return NextResponse.redirect(buildTikTokAuthUrl(state));
}
