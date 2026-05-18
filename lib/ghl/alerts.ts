import { createAdminSupabase } from '@/lib/supabase/admin';
import { sendCampaignAlert, type AlertMetrics } from './sms';
import { sendCampaignEmail } from './email';
import { triggerWorkflow } from './workflows';
import { tagContact, addAlertTag } from './contact-sync';
import { pauseCampaign } from '@/lib/integrations/facebook/campaigns';
import { getAdAccountsByPlatform, getDecryptedAccessToken } from '@/lib/integrations/accounts';

async function getTodayMetrics(campaignId: string) {
  const supabase = createAdminSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: todayRow } = await supabase
    .from('campaign_metrics')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('date', today)
    .single();

  const { data: history } = await supabase
    .from('campaign_metrics')
    .select('impressions, clicks, spend, conversions, roas')
    .eq('campaign_id', campaignId)
    .order('date', { ascending: false })
    .limit(14);

  const rows = history ?? [];
  const avgConversions =
    rows.length > 0
      ? rows.reduce((s, r) => s + Number(r.conversions), 0) / rows.length
      : 0;
  const avgClicks =
    rows.length > 0 ? rows.reduce((s, r) => s + Number(r.clicks), 0) / rows.length : 0;
  const avgConversionRate = avgClicks > 0 ? (avgConversions / avgClicks) * 100 : 0;

  const clicks = Number(todayRow?.clicks ?? 0);
  const conversions = Number(todayRow?.conversions ?? 0);
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

  return {
    today: todayRow,
    conversionRate,
    avgConversionRate,
    spend: Number(todayRow?.spend ?? 0),
    roas: todayRow?.roas != null ? Number(todayRow.roas) : null,
    conversions,
  };
}

async function maybeAutoPauseFacebook(userId: string, campaignId: string, externalCampaignId: string) {
  const accounts = await getAdAccountsByPlatform(userId, 'facebook');
  if (accounts.length === 0) return;

  const token = await getDecryptedAccessToken(accounts[0]);
  await pauseCampaign(token, externalCampaignId);

  const supabase = createAdminSupabase();
  await supabase.from('campaigns').update({ status: 'paused' }).eq('id', campaignId);
}

export async function checkCampaignAlerts(campaignId: string) {
  const supabase = createAdminSupabase();
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (!campaign) return { skipped: true };

  const userId = campaign.user_id;
  const { data: settings } = await supabase
    .from('user_alert_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  const roasThreshold = Number(settings?.roas_threshold ?? 2);
  const dropPct = Number(settings?.conversion_drop_pct ?? 30);
  const budgetWarnPct = Number(settings?.budget_warning_pct ?? 80);
  const autoPause = settings?.auto_pause_on_budget ?? false;

  const metricsData = await getTodayMetrics(campaignId);
  const dailyBudget = Number(campaign.budget_daily ?? 0);

  const baseMetrics: AlertMetrics = {
    spent: metricsData.spend,
    daily_budget: dailyBudget,
    conversions: metricsData.conversions,
    conversion_rate: metricsData.conversionRate,
    avg_conversion_rate: metricsData.avgConversionRate,
    roas: metricsData.roas ?? undefined,
    roas_threshold: roasThreshold,
  };

  const alertsSent: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // Budget 80% warning
  if (dailyBudget > 0 && metricsData.spend >= dailyBudget * (budgetWarnPct / 100)) {
    if (metricsData.spend < dailyBudget) {
      await sendCampaignAlert(userId, campaignId, 'budget_warning', baseMetrics);
      if (settings?.email_enabled !== false) {
        await triggerWorkflow(userId, 'budget_warning', campaignId, baseMetrics);
      }
      alertsSent.push('budget_warning');
    }
  }

  // Budget limit hit
  if (dailyBudget > 0 && metricsData.spend >= dailyBudget) {
    await sendCampaignAlert(userId, campaignId, 'budget_limit_hit', baseMetrics);
    alertsSent.push('budget_limit_hit');

    if (autoPause && campaign.external_campaign_id && campaign.platform === 'facebook') {
      await maybeAutoPauseFacebook(userId, campaignId, campaign.external_campaign_id);
    }
  }

  // Conversion rate drop
  if (
    metricsData.avgConversionRate > 0 &&
    metricsData.conversionRate < metricsData.avgConversionRate * (1 - dropPct / 100)
  ) {
    await sendCampaignAlert(userId, campaignId, 'conversion_rate_drop', baseMetrics);
    await addAlertTag(userId, 'conversion_rate_drop');
    if (settings?.email_enabled !== false) {
      await sendCampaignEmail(userId, campaignId, 'optimization', baseMetrics);
    }
    alertsSent.push('conversion_rate_drop');
  }

  // ROAS warning
  if (metricsData.roas != null && metricsData.roas < roasThreshold) {
    await sendCampaignAlert(userId, campaignId, 'roas_warning', baseMetrics);
    await addAlertTag(userId, 'roas_warning');
    if (settings?.email_enabled !== false) {
      await triggerWorkflow(userId, 'optimization', campaignId, baseMetrics);
    }
    alertsSent.push('roas_warning');
  }

  // Campaign live (start date is today)
  if (campaign.start_date === today && campaign.status === 'active') {
    await sendCampaignAlert(userId, campaignId, 'campaign_live', baseMetrics);
    await tagContact(userId, campaignId, campaign.campaign_name);
    alertsSent.push('campaign_live');
  }

  // Campaign ending (end date is today)
  if (campaign.end_date === today) {
    const { data: totals } = await supabase
      .from('campaign_metrics')
      .select('conversions, roas')
      .eq('campaign_id', campaignId);

    const totalConv = (totals ?? []).reduce((s, r) => s + Number(r.conversions), 0);
    const avgRoas =
      (totals ?? []).filter((r) => r.roas != null).length > 0
        ? (totals ?? []).reduce((s, r) => s + Number(r.roas ?? 0), 0) / (totals ?? []).length
        : 0;

    await sendCampaignAlert(userId, campaignId, 'campaign_ending', {
      ...baseMetrics,
      conversions: totalConv,
      final_roas: avgRoas,
    });
    alertsSent.push('campaign_ending');
  }

  return { campaignId, alertsSent };
}

export async function checkAllCampaignAlerts() {
  const supabase = createAdminSupabase();
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id')
    .in('status', ['active', 'paused']);

  const results = [];
  for (const c of campaigns ?? []) {
    try {
      results.push(await checkCampaignAlerts(c.id));
    } catch (err) {
      results.push({
        campaignId: c.id,
        error: err instanceof Error ? err.message : 'failed',
      });
    }
  }
  return results;
}

export async function sendDailyReports() {
  const supabase = createAdminSupabase();
  const now = new Date();
  const currentTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;

  const { data: workflows } = await supabase
    .from('ghl_workflows')
    .select('*')
    .eq('workflow_type', 'daily_report')
    .eq('is_active', true);

  const sent = [];
  for (const wf of workflows ?? []) {
    const preferred = (wf.config as { preferred_time?: string })?.preferred_time ?? '09:00';
    const prefShort = preferred.slice(0, 5);
    if (prefShort !== currentTime.slice(0, 5)) continue;

    if (!wf.campaign_id) continue;
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, campaign_name, user_id')
      .eq('id', wf.campaign_id)
      .single();
    if (!campaign) continue;

    const metricsData = await getTodayMetrics(campaign.id);
    const metrics: AlertMetrics = {
      spent: metricsData.spend,
      conversions: metricsData.conversions,
      roas: metricsData.roas ?? undefined,
    };

    await sendCampaignAlert(campaign.user_id, campaign.id, 'daily_report', metrics, {
      campaignName: campaign.campaign_name,
    });
    await sendCampaignEmail(campaign.user_id, campaign.id, 'daily_report', metrics, {
      campaignName: campaign.campaign_name,
    });
    sent.push(campaign.id);
  }

  return { sent };
}
