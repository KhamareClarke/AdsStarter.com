import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdAccountsByPlatform } from '@/lib/integrations/accounts';
import { syncTikTokAccount } from '@/lib/integrations/tiktok/sync';
import { handleApiError } from '@/lib/error-handler';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accounts = await getAdAccountsByPlatform(user.id, 'tiktok');
    const results = [];

    for (const account of accounts) {
      try {
        const stats = await syncTikTokAccount(user.id, account.id);
        results.push({ accountId: account.id, success: true, ...stats });
      } catch (err) {
        results.push({
          accountId: account.id,
          success: false,
          error: err instanceof Error ? err.message : 'Sync failed',
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/integrations/tiktok/sync');
    return NextResponse.json(body, { status });
  }
}
