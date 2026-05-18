-- Phase 1: Ad platform integration enhancements

ALTER TYPE integration_service ADD VALUE IF NOT EXISTS 'tiktok';
ALTER TYPE integration_service ADD VALUE IF NOT EXISTS 'youtube';

ALTER TABLE public.ad_accounts
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_synced TIMESTAMPTZ;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS last_synced TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS external_status TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_external_unique
  ON public.campaigns (ad_account_id, external_campaign_id)
  WHERE external_campaign_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ads_external_unique
  ON public.ads (campaign_id, external_ad_id)
  WHERE external_ad_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_accounts_user_platform_external
  ON public.ad_accounts (user_id, platform, external_account_id)
  WHERE external_account_id IS NOT NULL;
