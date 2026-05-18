import { createAdminSupabase } from '@/lib/supabase/admin';
import { calcRoas } from './metrics';

export interface CampaignMetricsTotals {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number | null;
  dateStart: string | null;
  dateEnd: string | null;
}

export async function getCampaignMetricsTotals(
  campaignId: string,
  revenuePerConversion = 35
): Promise<CampaignMetricsTotals | null> {
  const supabase = createAdminSupabase();
  const { data: rows, error } = await supabase
    .from('campaign_metrics')
    .select('date, spend, impressions, clicks, conversions')
    .eq('campaign_id', campaignId)
    .order('date', { ascending: true });

  if (error || !rows?.length) return null;

  const totals = rows.reduce(
    (acc, r) => ({
      impressions: acc.impressions + Number(r.impressions),
      clicks: acc.clicks + Number(r.clicks),
      spend: acc.spend + Number(r.spend),
      conversions: acc.conversions + Number(r.conversions),
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );

  const revenue = totals.conversions * revenuePerConversion;

  return {
    ...totals,
    revenue,
    roas: calcRoas(revenue, totals.spend),
    dateStart: rows[0].date,
    dateEnd: rows[rows.length - 1].date,
  };
}
