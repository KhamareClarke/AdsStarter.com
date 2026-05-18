import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { syncAllTikTokForUser } from '@/lib/integrations/tiktok/sync';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  const { data: accounts } = await supabase
    .from('ad_accounts')
    .select('user_id')
    .eq('platform', 'tiktok')
    .eq('is_active', true);

  const userIds = Array.from(new Set((accounts ?? []).map((a) => a.user_id)));
  const summary = [];

  for (const userId of userIds) {
    try {
      const results = await syncAllTikTokForUser(userId);
      summary.push({ userId, success: true, results });
    } catch (err) {
      summary.push({
        userId,
        success: false,
        error: err instanceof Error ? err.message : 'failed',
      });
    }
  }

  return NextResponse.json({ synced: summary.length, summary });
}
