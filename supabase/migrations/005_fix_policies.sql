-- Run this if 005_phase5_reports.sql failed with "policy already exists"
-- Safe to run multiple times.

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
