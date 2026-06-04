import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/error-handler';
import { emitEmpireActivity } from '@/lib/empire-activity';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.auth.signOut();
    if (user) {
      void emitEmpireActivity({
        event_type: 'logout',
        user_email: user.email,
        user_id: user.id,
        request,
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/auth/logout');
    return NextResponse.json(body, { status });
  }
}
