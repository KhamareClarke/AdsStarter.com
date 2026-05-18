import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncAllFacebookForUser } from '@/lib/integrations/facebook/sync';
import { handleApiError } from '@/lib/error-handler';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await syncAllFacebookForUser(user.id);

    if (process.env.GHL_API_KEY) {
      try {
        const { checkAllCampaignAlerts } = await import('@/lib/ghl/alerts');
        await checkAllCampaignAlerts();
      } catch {
        // Non-blocking: alert check failures should not fail sync
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/integrations/facebook/sync');
    return NextResponse.json(body, { status });
  }
}
