import { createAdminSupabase } from '@/lib/supabase/admin';
import { getAdAccountsByPlatform, getDecryptedAccessToken } from '@/lib/integrations/accounts';
import {
  pauseCampaign,
  resumeCampaign,
  updateCampaign,
} from '@/lib/integrations/facebook/campaigns';
export async function applyRecommendation(
  recommendationId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createAdminSupabase();

  const { data: rec } = await supabase
    .from('empire_os_recommendations')
    .select('*, campaigns(*)')
    .eq('id', recommendationId)
    .eq('user_id', userId)
    .single();

  if (!rec) throw new Error('Recommendation not found');
  if (rec.status !== 'pending' && rec.status !== 'accepted') {
    throw new Error('Recommendation already resolved');
  }

  const { data: settings } = await supabase
    .from('empire_os_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!settings?.allow_auto_optimize) {
    await supabase
      .from('empire_os_recommendations')
      .update({ status: 'accepted', resolved_at: new Date().toISOString() })
      .eq('id', recommendationId);
    return { success: true, message: 'Accepted — enable auto-optimize in settings to apply via API' };
  }

  const campaign = rec.campaigns as {
    id: string;
    platform: string;
    external_campaign_id: string | null;
    budget_daily: number | null;
  };

  let resultMessage = 'Applied';

  try {
    resultMessage = await executeOnPlatform(rec, campaign, settings, userId);
    await supabase
      .from('empire_os_recommendations')
      .update({ status: 'applied', resolved_at: new Date().toISOString() })
      .eq('id', recommendationId);
  } catch (err) {
    await supabase
      .from('empire_os_recommendations')
      .update({ status: 'failed', resolved_at: new Date().toISOString() })
      .eq('id', recommendationId);
    throw err;
  }

  await supabase.from('empire_os_optimization_logs').insert({
    user_id: userId,
    campaign_id: campaign.id,
    recommendation_id: recommendationId,
    action: rec.action,
    result: resultMessage,
    metadata: { rec_type: rec.rec_type, skill: rec.skill_name },
  });

  return { success: true, message: resultMessage };
}

async function executeOnPlatform(
  rec: { rec_type: string; title: string; payload?: Record<string, unknown> },
  campaign: { platform: string; external_campaign_id: string | null; budget_daily: number | null; id: string },
  settings: {
    allow_adjust_bids: boolean;
    allow_adjust_budgets: boolean;
    allow_pause_ads: boolean;
    max_bid_increase_pct: number;
    max_budget_increase_pct: number;
  },
  userId: string
): Promise<string> {
  const payload = (rec.payload ?? {}) as Record<string, number>;

  if (campaign.platform === 'facebook' && campaign.external_campaign_id && userId) {
    const accounts = await getAdAccountsByPlatform(userId, 'facebook');
    if (!accounts.length) return 'No Facebook account — saved recommendation only';
    const token = await getDecryptedAccessToken(accounts[0]);
    const extId = campaign.external_campaign_id;

    switch (rec.rec_type) {
      case 'pause_ad':
        if (!settings.allow_pause_ads) return 'Pause not allowed in settings';
        await pauseCampaign(token, extId);
        return 'Campaign paused on Facebook';

      case 'scale_campaign':
      case 'adjust_budget': {
        if (!settings.allow_adjust_budgets) return 'Budget changes not allowed in settings';
        const pct = payload.percentChange ?? payload.rampPct ?? 15;
        if (pct > settings.max_budget_increase_pct) {
          return `Increase ${pct}% exceeds max ${settings.max_budget_increase_pct}%`;
        }
        const newBudget = (Number(campaign.budget_daily) || 50) * (1 + pct / 100);
        await updateCampaign(token, extId, {
          daily_budget: Math.round(newBudget * 100),
        });
        return `Budget updated ~${pct}% on Facebook`;
      }

      case 'adjust_bid': {
        if (!settings.allow_adjust_bids) return 'Bid changes not allowed in settings';
        const pct = Math.abs(payload.percentChange ?? 15);
        if (pct > settings.max_bid_increase_pct && (payload.percentChange ?? 0) > 0) {
          return `Bid change exceeds max ${settings.max_bid_increase_pct}%`;
        }
        return `Bid recommendation logged — Facebook bid changes require ad set ID (Phase 4.1)`;
      }

      default:
        return `Recommendation accepted: ${rec.title}`;
    }
  }

  if (rec.rec_type === 'pause_ad' && settings.allow_pause_ads) {
    const supabase = createAdminSupabase();
    await supabase.from('campaigns').update({ status: 'paused' }).eq('id', campaign.id);
    return 'Campaign marked paused in AdsStarter';
  }

  return `Recommendation saved: ${rec.title}`;
}

export async function autoOptimizeCampaign(campaignId: string, userId: string) {
  const supabase = createAdminSupabase();
  const { data: settings } = await supabase
    .from('empire_os_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!settings?.allow_auto_optimize) return { applied: 0 };

  const { data: recs } = await supabase
    .from('empire_os_recommendations')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('confidence', 80);

  const results = [];
  for (const r of recs ?? []) {
    try {
      results.push(await applyRecommendation(r.id, userId));
    } catch (err) {
      results.push({
        success: false,
        message: err instanceof Error ? err.message : 'failed',
      });
    }
  }
  return { applied: results.filter((r) => r.success).length, results };
}
