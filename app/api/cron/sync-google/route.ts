import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { syncAllGoogleForUser } from '@/lib/integrations/google/sync';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  const { data: accounts } = await supabase
    .from('ad_accounts')
    .select('user_id, platform')
    .in('platform', ['google', 'youtube'])
    .eq('is_active', true);

  const userPlatform = new Map<string, Set<string>>();
  for (const a of accounts ?? []) {
    if (!userPlatform.has(a.user_id)) userPlatform.set(a.user_id, new Set());
    userPlatform.get(a.user_id)!.add(a.platform);
  }

  const summary = [];
  for (const [userId, platforms] of Array.from(userPlatform.entries())) {
    for (const platform of Array.from(platforms)) {
      try {
        const results = await syncAllGoogleForUser(
          userId,
          platform as 'google' | 'youtube'
        );
        summary.push({ userId, platform, success: true, results });
      } catch (err) {
        summary.push({
          userId,
          platform,
          success: false,
          error: err instanceof Error ? err.message : 'failed',
        });
      }
    }
  }

  return NextResponse.json({ synced: summary.length, summary });
}
