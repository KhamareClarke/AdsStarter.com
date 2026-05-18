import { createClient } from '@/lib/supabase/server';
import type { Campaign, CampaignMetric } from './types';

export async function getCampaignById(
  userId: string,
  campaignId: string
): Promise<Campaign | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as Campaign;
}

export async function updateCampaign(
  userId: string,
  campaignId: string,
  patch: Partial<{
    campaign_name: string;
    status: string;
    budget_daily: number;
    budget_total: number;
    start_date: string;
    end_date: string;
    objective: string;
    targeting: Record<string, unknown>;
  }>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', campaignId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function getCampaignMetrics(
  campaignId: string,
  days = 30
): Promise<CampaignMetric[]> {
  const supabase = await createClient();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const { data, error } = await supabase
    .from('campaign_metrics')
    .select('*')
    .eq('campaign_id', campaignId)
    .gte('date', start.toISOString().slice(0, 10))
    .order('date', { ascending: true });
  if (error) return [];
  return (data ?? []) as CampaignMetric[];
}

export async function getPerformanceKpis(userId: string, days = 30) {
  const supabase = await createClient();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startDate = start.toISOString().slice(0, 10);

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', userId);

  const ids = (campaigns ?? []).map((c) => c.id);
  if (!ids.length) {
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      roas: null as number | null,
      cpa: null as number | null,
      ctr: 0,
    };
  }

  const { data: metrics } = await supabase
    .from('campaign_metrics')
    .select('spend, impressions, clicks, conversions')
    .in('campaign_id', ids)
    .gte('date', startDate);

  const totals = (metrics ?? []).reduce(
    (acc, r) => ({
      spend: acc.spend + Number(r.spend),
      impressions: acc.impressions + Number(r.impressions),
      clicks: acc.clicks + Number(r.clicks),
      conversions: acc.conversions + Number(r.conversions),
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  );

  const defaultAov = 35;
  const revenue = totals.conversions * defaultAov;
  const roas = totals.spend > 0 ? revenue / totals.spend : null;
  const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : null;
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  return { ...totals, revenue, roas, cpa, ctr };
}
