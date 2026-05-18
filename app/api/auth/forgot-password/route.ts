import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) throw new AppError('Email required', 400);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
    });

    if (error) throw new AppError(error.message, 400, error.message);

    return NextResponse.json({
      success: true,
      message: 'If that email exists, we sent a reset link.',
    });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/auth/forgot-password');
    return NextResponse.json(body, { status });
  }
}
