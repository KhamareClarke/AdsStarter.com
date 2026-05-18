import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { buildGoogleAuthUrl } from '@/lib/integrations/google/oauth';
import { createOAuthState, setOAuthStateCookie } from '@/lib/integrations/oauth-state';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
  }

  const { state, payload } = createOAuthState('google', user.id);
  await setOAuthStateCookie('google', payload);
  return NextResponse.redirect(buildGoogleAuthUrl(state, 'google'));
}
