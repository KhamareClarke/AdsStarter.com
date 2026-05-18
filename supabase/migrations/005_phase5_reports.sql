-- Phase 5: Report settings, per-campaign overrides, ad-level metrics

CREATE TABLE IF NOT EXISTS public.report_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  sections JSONB NOT NULL DEFAULT '{
    "executive_summary": true,
    "performance_overview": true,
    "charts": true,
    "ad_analysis": true,
    "insights": true,
    "comparison": true
  }'::jsonb,
  agency_name TEXT,
  client_name TEXT,
  footer_note TEXT,
  default_aov NUMERIC(12, 2) NOT NULL DEFAULT 35,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campaign_report_settings (
  campaign_id UUID PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
  sections JSONB,
  agency_name TEXT,
  client_name TEXT,
  footer_note TEXT,
  default_aov NUMERIC(12, 2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ad-level daily metrics (populated by platform sync)
CREATE TABLE IF NOT EXISTS public.ad_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  spend NUMERIC(12, 2) NOT NULL DEFAULT 0,
  conversions BIGINT NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ad_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ad_metrics_ad_date ON public.ad_metrics(ad_id, date);

ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_report_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_metrics ENABLE ROW LEVEL SECURITY;

-- Idempotent policies (safe to re-run if a previous attempt stopped mid-file)
DROP POLICY IF EXISTS report_settings_own ON public.report_settings;
CREATE POLICY report_settings_own ON public.report_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS campaign_report_settings_own ON public.campaign_report_settings;
CREATE POLICY campaign_report_settings_own ON public.campaign_report_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_report_settings.campaign_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_report_settings.campaign_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS ad_metrics_via_campaign ON public.ad_metrics;
CREATE POLICY ad_metrics_via_campaign ON public.ad_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ads a
      JOIN public.campaigns c ON c.id = a.campaign_id
      WHERE a.id = ad_metrics.ad_id AND c.user_id = auth.uid()
    )
  );
