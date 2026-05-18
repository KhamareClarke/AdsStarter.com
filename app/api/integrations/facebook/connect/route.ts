import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildFacebookAuthUrl } from '@/lib/integrations/facebook/oauth';
import { createOAuthState, setOAuthStateCookie } from '@/lib/integrations/oauth-state';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login?redirect=/dashboard/accounts', process.env.NEXT_PUBLIC_APP_URL));
  }

  const { state, payload } = createOAuthState('facebook', user.id);
  await setOAuthStateCookie('facebook', payload);

  return NextResponse.redirect(buildFacebookAuthUrl(state));
}
