import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, AppError } from '@/lib/error-handler';
import { emitEmpireActivity } from '@/lib/empire-activity';

export async function POST(request: NextRequest) {
  let attemptedEmail: string | null = null;
  try {
    const { email, password } = await request.json();
    attemptedEmail = typeof email === 'string' ? email : null;

    if (!email || !password) {
      throw new AppError('Missing credentials', 400, 'Email and password are required');
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      void emitEmpireActivity({
        event_type: 'signin_failed',
        user_email: email,
        message: error.message,
        request,
      });
      throw new AppError(error.message, 401, 'Invalid email or password');
    }

    void emitEmpireActivity({
      event_type: 'signin',
      user_email: data.user?.email,
      user_id: data.user?.id,
      user_name: (data.user?.user_metadata as { full_name?: string } | null)?.full_name,
      request,
    });

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    if (attemptedEmail) {
      void emitEmpireActivity({
        event_type: 'signin_failed',
        user_email: attemptedEmail,
        message: error instanceof Error ? error.message : 'login error',
        request,
      });
    }
    const { status, body } = await handleApiError(error, 'api/auth/login');
    return NextResponse.json(body, { status });
  }
}
