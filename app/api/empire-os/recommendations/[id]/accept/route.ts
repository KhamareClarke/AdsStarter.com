import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRecommendation } from '@/lib/empire-os/auto-optimizer';
import { handleApiError } from '@/lib/error-handler';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await applyRecommendation(params.id, user.id);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = await handleApiError(error, 'empire-os/accept');
    return NextResponse.json(body, { status });
  }
}
