import { NextRequest, NextResponse } from 'next/server';
import { verifyAndConsumePendingSignup } from '@/lib/auth/signup-verification';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, AppError } from '@/lib/error-handler';
import { emitEmpireActivity } from '@/lib/empire-activity';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, code, password } = await request.json();

    if (!email || !code || !password) {
      throw new AppError(
        'Missing fields',
        400,
        'Email, password, and verification code are required'
      );
    }

    const { email: verifiedEmail, fullName } = await verifyAndConsumePendingSignup(
      email,
      code,
      password
    );

    const admin = createAdminSupabase();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: verifiedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      throw new AppError(createError.message, 400, createError.message);
    }

    if (created.user && process.env.GHL_API_KEY) {
      try {
        const { syncUserToGHL } = await import('@/lib/ghl/contact-sync');
        await syncUserToGHL(created.user.id, { name: fullName, email: verifiedEmail });
        await admin.from('user_alert_settings').upsert(
          { user_id: created.user.id },
          { onConflict: 'user_id' }
        );
      } catch (ghlErr) {
        console.error('GHL sync on signup failed:', ghlErr);
      }
    }

    const supabase = await createClient();
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
      email: verifiedEmail,
      password,
    });

    if (signInError) {
      throw new AppError(signInError.message, 400, signInError.message);
    }

    void emitEmpireActivity({
      event_type: 'signup',
      user_email: session.user?.email,
      user_id: session.user?.id,
      user_name: fullName,
      message: 'Verified signup completed',
      request,
    });
    void emitEmpireActivity({
      event_type: 'verify_email',
      user_email: session.user?.email,
      user_id: session.user?.id,
      request,
    });

    return NextResponse.json({
      success: true,
      user: session.user,
      message: 'Account created successfully',
    });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/auth/signup/verify');
    return NextResponse.json(body, { status });
  }
}
