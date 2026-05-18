import { createClient } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { Campaign, CampaignMetric, Profile } from './types';

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function getUserCampaigns(userId: string): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as Campaign[];
}

export async function createCampaign(
  userId: string,
  campaign: {
    campaign_name: string;
    platform: string;
    ad_account_id?: string;
    status?: string;
    budget_daily?: number;
    objective?: string;
  }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ user_id: userId, ...campaign })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCampaignMetrics(
  campaignId: string,
  metrics: Omit<CampaignMetric, 'id' | 'campaign_id' | 'recorded_at'>
) {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from('campaign_metrics')
    .upsert(
      { campaign_id: campaignId, ...metrics },
      { onConflict: 'campaign_id,date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDashboardStats(userId: string) {
  const supabase = await createClient();

  const [campaignsRes, accountsRes, notificationsRes] = await Promise.all([
    supabase.from('campaigns').select('id, status', { count: 'exact' }).eq('user_id', userId),
    supabase.from('ad_accounts').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_active', true),
    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false),
  ]);

  const campaigns = campaignsRes.data ?? [];
  return {
    totalCampaigns: campaignsRes.count ?? campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    connectedAccounts: accountsRes.count ?? 0,
    unreadNotifications: notificationsRes.count ?? 0,
  };
}
