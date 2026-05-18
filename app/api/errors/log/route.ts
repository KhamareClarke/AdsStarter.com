import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await logError({
      source: body.source ?? 'client',
      message: body.message ?? 'Unknown client error',
      stack: body.stack,
      userId: user?.id,
      metadata: body.metadata,
      severity: body.severity ?? 'error',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
