-- Run this if 003_phase3_ghl.sql failed on idx_ghl_logs_daily_dedupe
-- Safe to run after partial 003 migration

ALTER TABLE public.ghl_notification_logs
  ADD COLUMN IF NOT EXISTS sent_date DATE NOT NULL DEFAULT CURRENT_DATE;

DROP INDEX IF EXISTS idx_ghl_logs_daily_dedupe;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ghl_logs_daily_dedupe
  ON public.ghl_notification_logs (campaign_id, alert_type, channel, sent_date)
  WHERE campaign_id IS NOT NULL;

-- Policies (skip if already exist — ignore duplicate errors)
DO $$ BEGIN
  CREATE POLICY "Users manage own alert settings" ON public.user_alert_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users read own ghl workflows" ON public.ghl_workflows
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users read own ghl logs" ON public.ghl_notification_logs
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
