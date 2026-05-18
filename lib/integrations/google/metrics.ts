import { searchGoogleAds } from './oauth';

export async function getCampaignMetrics(
  accessToken: string,
  customerId: string,
  campaignId: string,
  dateStart: string,
  dateStop: string
) {
  const customer = customerId.replace('customers/', '');
  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE campaign.id = ${campaignId}
      AND segments.date BETWEEN '${dateStart}' AND '${dateStop}'
    ORDER BY segments.date
  `;
  return searchGoogleAds<{
    segments: { date: string };
    metrics: {
      impressions: string;
      clicks: string;
      costMicros: string;
      conversions: number;
      conversionsValue: number;
    };
  }>(accessToken, customer, query);
}

export function parseGoogleMetrics(row: {
  segments: { date: string };
  metrics: {
    impressions: string;
    clicks: string;
    costMicros: string;
    conversions: number;
    conversionsValue: number;
  };
}) {
  const impressions = parseInt(row.metrics.impressions ?? '0', 10);
  const clicks = parseInt(row.metrics.clicks ?? '0', 10);
  const spend = parseInt(row.metrics.costMicros ?? '0', 10) / 1_000_000;
  const conversions = row.metrics.conversions ?? 0;
  const conversionValue = row.metrics.conversionsValue ?? 0;

  return {
    date: row.segments.date,
    impressions,
    clicks,
    spend,
    conversions,
    cpc: clicks > 0 ? spend / clicks : null,
    cpa: conversions > 0 ? spend / conversions : null,
    roas: spend > 0 ? conversionValue / spend : null,
  };
}
