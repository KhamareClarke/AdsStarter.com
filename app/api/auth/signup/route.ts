import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'Email and password are required');
    }
    if (password.length < 8) {
      throw new AppError('Password too short', 400, 'Password must be at least 8 characters');
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName ?? '' },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) throw new AppError(error.message, 400, error.message);

    if (data.user && process.env.GHL_API_KEY) {
      try {
        const { syncUserToGHL } = await import('@/lib/ghl/contact-sync');
        const { createAdminSupabase } = await import('@/lib/supabase/admin');
        await syncUserToGHL(data.user.id, {
          name: fullName ?? '',
          email,
        });
        const admin = createAdminSupabase();
        await admin.from('user_alert_settings').upsert(
          { user_id: data.user.id },
          { onConflict: 'user_id' }
        );
      } catch (ghlErr) {
        console.error('GHL sync on signup failed:', ghlErr);
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      message: data.session
        ? 'Account created successfully'
        : 'Check your email to confirm your account',
    });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/auth/signup');
    return NextResponse.json(body, { status });
  }
}
