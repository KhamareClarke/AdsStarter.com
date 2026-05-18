import { createAdminSupabase } from '@/lib/supabase/admin';
import {
  getAdAccountsByPlatform,
  getDecryptedAccessToken,
  markAccountSynced,
} from '@/lib/integrations/accounts';
import { mapTikTokCampaignStatus } from '@/lib/integrations/status-map';
import { getCampaigns } from './oauth';

export async function syncTikTokAccount(userId: string, accountId: string) {
  const accounts = await getAdAccountsByPlatform(userId, 'tiktok');
  const account = accounts.find((a) => a.id === accountId);
  if (!account?.external_account_id) throw new Error('TikTok account not found');

  const token = await getDecryptedAccessToken(account);
  const campaigns = await getCampaigns(token, account.external_account_id);
  const supabase = createAdminSupabase();
  let synced = 0;

  for (const c of campaigns) {
    const { error } = await supabase.from('campaigns').upsert(
      {
        user_id: userId,
        ad_account_id: account.id,
        campaign_name: c.campaign_name ?? c.name ?? 'TikTok Campaign',
        platform: 'tiktok',
        external_campaign_id: String(c.campaign_id ?? c.id),
        external_status: c.operation_status ?? c.status,
        status: mapTikTokCampaignStatus(c.operation_status ?? c.status ?? ''),
        last_synced: new Date().toISOString(),
      },
      { onConflict: 'ad_account_id,external_campaign_id' }
    );
    if (!error) synced++;
  }

  await markAccountSynced(account.id);
  return { campaignsSynced: synced };
}

export async function syncAllTikTokForUser(userId: string) {
  const accounts = await getAdAccountsByPlatform(userId, 'tiktok');
  const results = [];
  for (const account of accounts) {
    try {
      const stats = await syncTikTokAccount(userId, account.id);
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
