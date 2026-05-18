import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!password || password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new AppError(error.message, 400, error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/auth/update-password');
    return NextResponse.json(body, { status });
  }
}
