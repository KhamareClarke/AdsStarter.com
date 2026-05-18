import { NextResponse } from 'next/server';
import { getAppUrl } from '@/lib/app-url';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const appUrl = getAppUrl();
  const nextPath = next.startsWith('/') ? next : `/${next}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${appUrl}${nextPath}`);
    }
  }

  return NextResponse.redirect(`${appUrl}/login?error=auth_callback_failed`);
}
