import { NextRequest, NextResponse } from 'next/server';
import { resendSignupCode } from '@/lib/auth/signup-verification';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      throw new AppError('Missing fields', 400, 'Email and password are required');
    }

    await resendSignupCode(email, password);

    return NextResponse.json({
      success: true,
      message: 'A new verification code was sent to your email.',
    });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/auth/signup/resend');
    return NextResponse.json(body, { status });
  }
}
