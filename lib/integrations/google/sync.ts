import { createAdminSupabase } from '@/lib/supabase/admin';
import {
  getAdAccountsByPlatform,
  getDecryptedAccessToken,
  markAccountSynced,
} from '@/lib/integrations/accounts';
import { getCampaigns, parseGoogleCampaign } from './campaigns';
import type { AdPlatform } from '@/lib/db/types';

export async function syncGoogleAccount(
  userId: string,
  accountId: string,
  platform: AdPlatform = 'google'
) {
  const accounts = await getAdAccountsByPlatform(userId, platform);
  const account = accounts.find((a) => a.id === accountId);
  if (!account?.external_account_id) throw new Error('Google ad account not found');

  const token = await getDecryptedAccessToken(account);
  const customerId = account.external_account_id;
  const rows = await getCampaigns(token, customerId);
  const supabase = createAdminSupabase();
  let synced = 0;

  for (const row of rows) {
    const parsed = parseGoogleCampaign(row);
    const { error } = await supabase.from('campaigns').upsert(
      {
        user_id: userId,
        ad_account_id: account.id,
        campaign_name: parsed.name,
        platform,
        external_campaign_id: parsed.externalId,
        external_status: parsed.externalStatus,
        status: parsed.status,
        budget_daily: parsed.budgetDaily,
        objective: parsed.channel ?? null,
        last_synced: new Date().toISOString(),
      },
      { onConflict: 'ad_account_id,external_campaign_id' }
    );
    if (!error) synced++;
  }

  await markAccountSynced(account.id);
  return { campaignsSynced: synced };
}

export async function syncAllGoogleForUser(userId: string, platform: AdPlatform = 'google') {
  const accounts = await getAdAccountsByPlatform(userId, platform);
  const results = [];
  for (const account of accounts) {
    try {
      const stats = await syncGoogleAccount(userId, account.id, platform);
      results.push({ accountId: account.id, success: true, ...stats });
    } catch (err) {
      results.push({
        accountId: account.id,
        success: false,
        error: err instanceof Error ? err.message : 'Sync failed',
      });
    }
  }
  return results;
}
