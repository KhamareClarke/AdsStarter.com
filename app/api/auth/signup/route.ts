import { NextRequest, NextResponse } from 'next/server';
import { createPendingSignup } from '@/lib/auth/signup-verification';
import { createAdminSupabase } from '@/lib/supabase/admin';
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

    const normalized = email.trim().toLowerCase();

    const admin = createAdminSupabase();
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', normalized)
      .maybeSingle();
    if (existingProfile) {
      throw new AppError('Email in use', 400, 'An account with this email already exists');
    }

    await createPendingSignup(normalized, password, fullName ?? '');

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      message: 'We sent a 6-digit code to your email. Enter it below to finish signing up.',
    });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/auth/signup');
    return NextResponse.json(body, { status });
  }
}
