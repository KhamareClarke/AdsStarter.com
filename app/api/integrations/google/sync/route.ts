import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncAllGoogleForUser } from '@/lib/integrations/google/sync';
import { handleApiError } from '@/lib/error-handler';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const results = await syncAllGoogleForUser(user.id, 'google');
    return NextResponse.json({ success: true, results });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/integrations/google/sync');
    return NextResponse.json(body, { status });
  }
}
