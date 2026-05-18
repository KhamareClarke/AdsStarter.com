import { createAdminSupabase } from '@/lib/supabase/admin';
import { getBenchmarks } from '@/lib/empire-os/benchmarks';
import {
  calcConversionRate,
  calcCpa,
  calcCpc,
  calcCtr,
  calcRoas,
  starRating,
} from './metrics';
import type { CampaignReportData, ReportRenderOptions } from './types';
import { buildCampaignReportHtml } from './build-report-html';

const PLATFORM_BENCHMARK_CTR: Record<string, number> = {
  facebook: 1.2,
  google: 2.5,
  tiktok: 1.0,
  youtube: 0.8,
  instagram: 1.1,
};

export async function fetchCampaignReportData(
  campaignId: string,
  userId: string,
  options?: { revenuePerConversion?: number; dateStart?: string; dateEnd?: string }
): Promise<CampaignReportData> {
  const supabase = createAdminSupabase();
  const aov = options?.revenuePerConversion ?? 35;

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single();

  if (error || !campaign) throw new Error('Campaign not found');

  const dateEnd = options?.dateEnd ?? new Date().toISOString().slice(0, 10);
  const dateStart =
    options?.dateStart ??
    campaign.start_date ??
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().slice(0, 10);
    })();

  const { data: metrics } = await supabase
    .from('campaign_metrics')
    .select('*')
    .eq('campaign_id', campaignId)
    .gte('date', dateStart)
    .lte('date', dateEnd)
    .order('date', { ascending: true });

  const rows = metrics ?? [];
  const totals = rows.reduce(
    (acc, r) => ({
      impressions: acc.impressions + Number(r.impressions),
      clicks: acc.clicks + Number(r.clicks),
      spend: acc.spend + Number(r.spend),
      conversions: acc.conversions + Number(r.conversions),
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );

  const revenue = totals.conversions * aov;
  const roas = calcRoas(revenue, totals.spend);
  const ctr = calcCtr(totals.clicks, totals.impressions);

  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('campaign_id', campaignId);

  const adIds = (ads ?? []).map((a) => a.id);
  let adMetricsByAd: Record<string, { impressions: number; clicks: number; spend: number; conversions: number }> =
    {};

  if (adIds.length) {
    const { data: adMetricRows, error: adMetricsError } = await supabase
      .from('ad_metrics')
      .select('ad_id, impressions, clicks, spend, conversions')
      .in('ad_id', adIds)
      .gte('date', dateStart)
      .lte('date', dateEnd);

    if (!adMetricsError) for (const row of adMetricRows ?? []) {
      const id = row.ad_id as string;
      if (!adMetricsByAd[id]) {
        adMetricsByAd[id] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
      }
      adMetricsByAd[id].impressions += Number(row.impressions);
      adMetricsByAd[id].clicks += Number(row.clicks);
      adMetricsByAd[id].spend += Number(row.spend);
      adMetricsByAd[id].conversions += Number(row.conversions);
    }
  }

  const adCount = Math.max(ads?.length ?? 1, 1);
  const adRows = (ads ?? []).map((ad) => {
    const m = adMetricsByAd[ad.id];
    const imp = m?.impressions ?? Math.floor(totals.impressions / adCount);
    const clk = m?.clicks ?? Math.floor(totals.clicks / adCount);
    const conv = m?.conversions ?? Math.floor(totals.conversions / adCount);
    const spend = m?.spend ?? totals.spend / adCount;
    const adCtr = calcCtr(clk, imp);
    return {
      ad_name: ad.ad_name,
      impressions: imp,
      ctr: adCtr,
      cpc: calcCpc(spend, clk),
      conversions: conv,
      cpa: calcCpa(spend, conv),
      spend,
      rating: starRating(adCtr, PLATFORM_BENCHMARK_CTR[campaign.platform] ?? 1.2),
    };
  });

  adRows.sort((a, b) => b.conversions - a.conversions);

  const daily = rows.map((r) => ({
    date: r.date,
    spend: Number(r.spend),
    conversions: Number(r.conversions),
    roas: r.roas != null ? Number(r.roas) : calcRoas(Number(r.conversions) * aov, Number(r.spend)),
  }));

  const { data: empireRecs } = await supabase
    .from('empire_os_recommendations')
    .select('title, action, expected_impact')
    .eq('campaign_id', campaignId)
    .in('status', ['pending', 'applied'])
    .limit(5);

  const benchmarks = getBenchmarks();
  const platformCtr = PLATFORM_BENCHMARK_CTR[campaign.platform] ?? benchmarks.ctr;

  const { data: prevCampaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', userId)
    .neq('id', campaignId)
    .limit(5);

  let prevSpendAvg: number | null = null;
  if (prevCampaigns?.length) {
    const ids = prevCampaigns.map((c) => c.id);
    const { data: prevMetrics } = await supabase
      .from('campaign_metrics')
      .select('spend')
      .in('campaign_id', ids);
    const sum = (prevMetrics ?? []).reduce((s, m) => s + Number(m.spend), 0);
    prevSpendAvg = prevMetrics?.length ? sum / prevMetrics.length : null;
  }

  const mid = Math.floor(daily.length / 2);
  const firstHalf = daily.slice(0, mid);
  const secondHalf = daily.slice(mid);
  const roasFirst =
    firstHalf.length && firstHalf.reduce((s, d) => s + d.spend, 0) > 0
      ? firstHalf.reduce((s, d) => s + (d.roas ?? 0), 0) / firstHalf.length
      : null;
  const roasSecond =
    secondHalf.length && secondHalf.reduce((s, d) => s + d.spend, 0) > 0
      ? secondHalf.reduce((s, d) => s + (d.roas ?? 0), 0) / secondHalf.length
      : null;

  const worked_well: string[] = [];
  const improve: string[] = [];

  if (roas != null && roas >= 2) worked_well.push(`Strong ROAS at ${roas.toFixed(2)}x`);
  if (ctr >= platformCtr) worked_well.push(`CTR ${ctr.toFixed(2)}% beats platform average`);
  if (totals.conversions > 0) worked_well.push(`${totals.conversions} conversions in period`);

  if (roas != null && roas < 2) improve.push('ROAS below 2x target — review audience and creative');
  if (ctr < platformCtr) improve.push('CTR below platform benchmark — test new ad creative');
  if (totals.conversions === 0) improve.push('No conversions recorded — check landing page and tracking');

  return {
    campaign: {
      id: campaign.id,
      name: campaign.campaign_name,
      platform: campaign.platform,
      status: campaign.status,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
    },
    period: { start: dateStart, end: dateEnd },
    summary: {
      spend: totals.spend,
      impressions: totals.impressions,
      clicks: totals.clicks,
      conversions: totals.conversions,
      revenue,
      roas,
      ctr,
      cpc: calcCpc(totals.spend, totals.clicks),
      cpa: calcCpa(totals.spend, totals.conversions),
      conversion_rate: calcConversionRate(totals.conversions, totals.clicks),
    },
    daily,
    ads: adRows,
    insights: {
      worked_well: worked_well.length ? worked_well : ['Insufficient data — sync more metrics'],
      improve: improve.length ? improve : ['Continue monitoring performance'],
      next_steps: [
        'Review top-performing ads and allocate more budget',
        'Pause or refresh ads below 1⭐ rating',
        'Run Empire OS analysis for AI recommendations',
      ],
      empire_os: (empireRecs ?? []).map((r) => `${r.title}: ${r.action}`),
    },
    comparison: {
      vs_platform_ctr:
        ctr >= platformCtr
          ? `${((ctr / platformCtr - 1) * 100).toFixed(0)}% above ${campaign.platform} average`
          : `${((1 - ctr / platformCtr) * 100).toFixed(0)}% below ${campaign.platform} average`,
      vs_previous_spend:
        prevSpendAvg != null
          ? `${totals.spend >= prevSpendAvg ? 'Higher' : 'Lower'} than your other campaigns avg spend`
          : null,
      month_over_month_roas:
        roasFirst != null && roasSecond != null
          ? `Period ROAS trend: ${roasFirst.toFixed(2)}x → ${roasSecond.toFixed(2)}x`
          : null,
    },
    generated_at: new Date().toISOString(),
  };
}

export function generateCampaignReportHtml(
  data: CampaignReportData,
  options: ReportRenderOptions = {}
) {
  return buildCampaignReportHtml(data, options);
}
