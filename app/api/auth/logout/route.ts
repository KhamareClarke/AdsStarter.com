import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/error-handler';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/auth/logout');
    return NextResponse.json(body, { status });
  }
}
