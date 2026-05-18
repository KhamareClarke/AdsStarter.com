import { createAdminSupabase } from '@/lib/supabase/admin';
import { getAdAccountsByPlatform, getDecryptedAccessToken, markAccountSynced } from '@/lib/integrations/accounts';
import { mapFacebookAdStatus, mapFacebookCampaignStatus } from '@/lib/integrations/status-map';
import { getCampaigns } from './campaigns';
import { getAds } from './ads';
import { getCampaignMetrics, parseInsightMetrics } from './metrics';

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function syncFacebookAccount(userId: string, accountId: string) {
  const accounts = await getAdAccountsByPlatform(userId, 'facebook');
  const account = accounts.find((a) => a.id === accountId);
  if (!account?.external_account_id) throw new Error('Account not found');

  const token = await getDecryptedAccessToken(account);
  const supabase = createAdminSupabase();
  const externalActId = account.external_account_id.replace(/^act_/, '');

  const fbCampaigns = await getCampaigns(token, externalActId);
  let campaignsSynced = 0;
  let adsSynced = 0;
  let metricsSynced = 0;

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);

  for (const fb of fbCampaigns) {
    const dailyBudget = fb.daily_budget ? parseFloat(fb.daily_budget) / 100 : null;

    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .upsert(
        {
          user_id: userId,
          ad_account_id: account.id,
          campaign_name: fb.name,
          platform: 'facebook',
          external_campaign_id: fb.id,
          external_status: fb.status,
          status: mapFacebookCampaignStatus(fb.status),
          budget_daily: dailyBudget,
          objective: fb.objective ?? null,
          start_date: fb.start_time?.slice(0, 10) ?? null,
          end_date: fb.stop_time?.slice(0, 10) ?? null,
          last_synced: new Date().toISOString(),
        },
        { onConflict: 'ad_account_id,external_campaign_id' }
      )
      .select('id')
      .single();

    if (campError || !campaign) continue;
    campaignsSynced++;

    const fbAds = await getAds(token, fb.id);
    for (const ad of fbAds) {
      const { error: adError } = await supabase.from('ads').upsert(
        {
          campaign_id: campaign.id,
          ad_name: ad.name,
          external_ad_id: ad.id,
          status: mapFacebookAdStatus(ad.status),
        },
        { onConflict: 'campaign_id,external_ad_id' }
      );
      if (!adError) adsSynced++;
    }

    const insights = await getCampaignMetrics(
      token,
      fb.id,
      formatDate(start),
      formatDate(end)
    );

    for (const row of insights) {
      const m = parseInsightMetrics(row);
      const { error: metricError } = await supabase.from('campaign_metrics').upsert(
        {
          campaign_id: campaign.id,
          date: m.date,
          impressions: m.impressions,
          clicks: m.clicks,
          spend: m.spend,
          conversions: m.conversions,
          cpc: m.cpc,
          cpa: m.cpa,
          roas: m.roas,
        },
        { onConflict: 'campaign_id,date' }
      );
      if (!metricError) metricsSynced++;
    }
  }

  await markAccountSynced(account.id);

  return { campaignsSynced, adsSynced, metricsSynced };
}

export async function syncAllFacebookForUser(userId: string) {
  const accounts = await getAdAccountsByPlatform(userId, 'facebook');
  const results = [];

  for (const account of accounts) {
    try {
      const stats = await syncFacebookAccount(userId, account.id);
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
