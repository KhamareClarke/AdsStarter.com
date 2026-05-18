-- Phase 3: Go High Level notifications & workflows

CREATE TYPE ghl_alert_type AS ENUM (
  'budget_limit_hit',
  'budget_warning',
  'conversion_rate_drop',
  'roas_warning',
  'campaign_live',
  'campaign_ending',
  'daily_report'
);

CREATE TYPE ghl_delivery_channel AS ENUM ('sms', 'email', 'both');
CREATE TYPE ghl_delivery_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');

CREATE TABLE IF NOT EXISTS public.user_alert_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone TEXT,
  roas_threshold NUMERIC(6, 2) NOT NULL DEFAULT 2.0,
  conversion_drop_pct NUMERIC(5, 2) NOT NULL DEFAULT 30,
  budget_warning_pct NUMERIC(5, 2) NOT NULL DEFAULT 80,
  auto_pause_on_budget BOOLEAN NOT NULL DEFAULT false,
  daily_report_time TIME NOT NULL DEFAULT '09:00',
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ghl_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL,
  ghl_workflow_id TEXT,
  ghl_webhook_id TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, workflow_type, campaign_id)
);

CREATE TABLE IF NOT EXISTS public.ghl_notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  alert_type ghl_alert_type NOT NULL,
  channel ghl_delivery_channel NOT NULL,
  status ghl_delivery_status NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL,
  ghl_message_id TEXT,
  ghl_contact_id TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ghl_logs_user_sent ON public.ghl_notification_logs(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghl_logs_campaign_alert ON public.ghl_notification_logs(campaign_id, alert_type, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghl_logs_status ON public.ghl_notification_logs(status, sent_at DESC);

-- Dedupe: one alert type per campaign per day (sent_date is immutable-safe for indexes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ghl_logs_daily_dedupe
  ON public.ghl_notification_logs (campaign_id, alert_type, channel, sent_date)
  WHERE campaign_id IS NOT NULL;

ALTER TABLE public.user_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghl_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghl_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alert settings" ON public.user_alert_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own ghl workflows" ON public.ghl_workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own ghl logs" ON public.ghl_notification_logs
  FOR SELECT USING (auth.uid() = user_id);
