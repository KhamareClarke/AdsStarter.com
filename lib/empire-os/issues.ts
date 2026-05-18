import type { CampaignIssue, CampaignMetricsSnapshot, IndustryBenchmarks } from './types';

export interface DetectedIssue {
  key: CampaignIssue;
  severity: 'high' | 'medium' | 'low';
  detail: string;
}

export function detectIssues(
  metrics: CampaignMetricsSnapshot,
  benchmarks: IndustryBenchmarks,
  roasTarget = 2
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  if (metrics.impressions < 100) return issues;

  if (metrics.roas != null && metrics.roas < roasTarget * 0.85) {
    issues.push({
      key: 'low_roas',
      severity: metrics.roas < roasTarget * 0.6 ? 'high' : 'medium',
      detail: `ROAS ${metrics.roas.toFixed(2)}x vs target ${roasTarget}x`,
    });
  }

  if (metrics.ctr < benchmarks.ctr * 0.7) {
    issues.push({
      key: 'low_ctr',
      severity: 'medium',
      detail: `CTR ${metrics.ctr.toFixed(2)}% vs benchmark ${benchmarks.ctr}%`,
    });
  }

  if (metrics.cpa != null && metrics.cpa > benchmarks.cpa * 1.25) {
    issues.push({
      key: 'high_cpa',
      severity: 'high',
      detail: `CPA $${metrics.cpa.toFixed(2)} vs benchmark $${benchmarks.cpa}`,
    });
  }

  if (metrics.conversion_rate < benchmarks.conversion_rate * 0.6 && metrics.clicks > 50) {
    issues.push({
      key: 'low_conversions',
      severity: 'medium',
      detail: `Conversion rate ${metrics.conversion_rate.toFixed(2)}% is below benchmark`,
    });
  }

  if (
    metrics.roas != null &&
    metrics.roas >= roasTarget * 1.1 &&
    metrics.cpc != null &&
    metrics.cpc < benchmarks.cpc * 0.85
  ) {
    issues.push({
      key: 'scale_opportunity',
      severity: 'low',
      detail: `Strong ROAS with CPC ${((1 - metrics.cpc / benchmarks.cpc) * 100).toFixed(0)}% below benchmark — room to scale`,
    });
  }

  return issues;
}

export function buildMetricsSnapshot(rows: {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  cpc: number | null;
  cpa: number | null;
  roas: number | null;
}[]): CampaignMetricsSnapshot {
  const totals = rows.reduce(
    (acc, r) => ({
      impressions: acc.impressions + Number(r.impressions),
      clicks: acc.clicks + Number(r.clicks),
      spend: acc.spend + Number(r.spend),
      conversions: acc.conversions + Number(r.conversions),
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : null;
  const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : null;
  const roasRows = rows.filter((r) => r.roas != null);
  const roas =
    roasRows.length > 0
      ? roasRows.reduce((s, r) => s + Number(r.roas), 0) / roasRows.length
      : null;

  return {
    ...totals,
    cpc,
    cpa,
    roas,
    ctr,
    conversion_rate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
  };
}
