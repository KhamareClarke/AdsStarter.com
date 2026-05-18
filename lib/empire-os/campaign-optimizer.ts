import { createAdminSupabase } from '@/lib/supabase/admin';
import { getBenchmarks } from './benchmarks';
import { buildMetricsSnapshot, detectIssues } from './issues';
import { runEmpireSkills } from './skills';
import type { EmpireRecommendationInput } from './types';
import { notifyEmpireRecommendations } from './notifier';

export async function analyzeAndRecommend(campaignId: string) {
  const supabase = createAdminSupabase();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (!campaign) throw new Error('Campaign not found');

  const { data: settings } = await supabase
    .from('empire_os_settings')
    .select('*')
    .eq('user_id', campaign.user_id)
    .maybeSingle();

  const { data: alertSettings } = await supabase
    .from('user_alert_settings')
    .select('roas_threshold')
    .eq('user_id', campaign.user_id)
    .maybeSingle();

  const industry = settings?.industry ?? 'general';
  const roasTarget = Number(alertSettings?.roas_threshold ?? 2);

  const since = new Date();
  since.setDate(since.getDate() - 14);

  const { data: metricRows } = await supabase
    .from('campaign_metrics')
    .select('*')
    .eq('campaign_id', campaignId)
    .gte('date', since.toISOString().slice(0, 10));

  if (!metricRows?.length) {
    return { campaignId, recommendations: [], skipped: 'no_metrics' };
  }

  const metrics = buildMetricsSnapshot(metricRows);
  const benchmarks = getBenchmarks(industry);
  const issues = detectIssues(metrics, benchmarks, roasTarget);

  const stored: string[] = [];

  for (const issue of issues) {
    const recs = runEmpireSkills({
      campaignName: campaign.campaign_name,
      platform: campaign.platform,
      metrics,
      issue,
      dailyBudget: campaign.budget_daily,
    });

    for (const rec of recs) {
      const id = await storeRecommendation(campaign.user_id, campaignId, rec);
      if (id) stored.push(id);
    }
  }

  if (stored.length > 0) {
    await notifyEmpireRecommendations(campaign.user_id, campaignId, campaign.campaign_name, stored.length);
  }

  return { campaignId, issues: issues.map((i) => i.key), recommendations: stored };
}

async function storeRecommendation(
  userId: string,
  campaignId: string,
  rec: EmpireRecommendationInput
): Promise<string | null> {
  const supabase = createAdminSupabase();

  const { data, error } = await supabase
    .from('empire_os_recommendations')
    .insert({
      user_id: userId,
      campaign_id: campaignId,
      skill_name: rec.skill,
      rec_type: rec.type,
      status: 'pending',
      title: rec.title,
      action: rec.action,
      reason: rec.reason,
      expected_impact: rec.expected_impact,
      confidence: rec.confidence,
      payload: rec.payload ?? {},
      issue_key: rec.issue_key,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return null;
    throw error;
  }
  return data?.id ?? null;
}

export async function analyzeAllCampaigns() {
  const supabase = createAdminSupabase();
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id')
    .in('status', ['active', 'paused']);

  const results = [];
  for (const c of campaigns ?? []) {
    try {
      results.push(await analyzeAndRecommend(c.id));
    } catch (err) {
      results.push({
        campaignId: c.id,
        error: err instanceof Error ? err.message : 'failed',
      });
    }
  }
  return results;
}
