import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      throw new AppError('Missing credentials', 400, 'Email and password are required');
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw new AppError(error.message, 401, 'Invalid email or password');

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/auth/login');
    return NextResponse.json(body, { status });
  }
}
