import { facebookGet } from './client';

export interface FbInsightRow {
  date_start: string;
  date_stop: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
}

export async function getCampaignMetrics(
  accessToken: string,
  campaignId: string,
  dateStart: string,
  dateStop: string
): Promise<FbInsightRow[]> {
  const result = await facebookGet<{ data: FbInsightRow[] }>(
    `/${campaignId}/insights`,
    accessToken,
    {
      fields: 'impressions,clicks,spend,actions,action_values',
      time_range: JSON.stringify({ since: dateStart, until: dateStop }),
      time_increment: '1',
      level: 'campaign',
    }
  );
  return result.data ?? [];
}

export function parseInsightMetrics(row: FbInsightRow) {
  const impressions = parseInt(row.impressions ?? '0', 10);
  const clicks = parseInt(row.clicks ?? '0', 10);
  const spend = parseFloat(row.spend ?? '0');

  let conversions = 0;
  let conversionValue = 0;

  row.actions?.forEach((a) => {
    if (a.action_type === 'purchase' || a.action_type === 'offsite_conversion') {
      conversions += parseInt(a.value, 10);
    }
  });

  row.action_values?.forEach((a) => {
    if (a.action_type === 'purchase' || a.action_type === 'offsite_conversion') {
      conversionValue += parseFloat(a.value);
    }
  });

  const cpc = clicks > 0 ? spend / clicks : null;
  const cpa = conversions > 0 ? spend / conversions : null;
  const roas = spend > 0 ? conversionValue / spend : null;

  return {
    date: row.date_start,
    impressions,
    clicks,
    spend,
    conversions,
    cpc,
    cpa,
    roas,
  };
}
