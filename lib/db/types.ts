export type SubscriptionTier = 'free' | 'starter' | 'pro';
export type AdPlatform = 'facebook' | 'instagram' | 'tiktok' | 'google' | 'youtube';
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';
export type AdStatus = 'active' | 'paused' | 'rejected' | 'draft';
export type NotificationType = 'performance_alert' | 'budget_warning' | 'recommendation' | 'system';
export type IntegrationService =
  | 'ghl'
  | 'stripe'
  | 'zapier'
  | 'facebook'
  | 'google'
  | 'tiktok'
  | 'youtube';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: SubscriptionTier;
  ghl_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdAccount {
  id: string;
  user_id: string;
  platform: AdPlatform;
  account_name: string;
  external_account_id: string | null;
  is_active: boolean;
  connected_at: string;
  metrics_last_synced: string | null;
}

export interface Campaign {
  id: string;
  user_id: string;
  ad_account_id: string | null;
  campaign_name: string;
  platform: AdPlatform;
  external_campaign_id: string | null;
  status: CampaignStatus;
  budget_daily: number | null;
  budget_total: number | null;
  start_date: string | null;
  end_date: string | null;
  objective: string | null;
  targeting: Record<string, unknown>;
  created_at: string;
}

export interface CampaignMetric {
  id: string;
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  cpc: number | null;
  cpa: number | null;
  roas: number | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  sent_via: 'email' | 'sms' | 'in_app';
  created_at: string;
}
