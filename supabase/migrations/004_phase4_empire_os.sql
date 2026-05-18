-- Phase 4: Empire OS recommendations & auto-optimization

CREATE TYPE empire_rec_status AS ENUM ('pending', 'accepted', 'declined', 'applied', 'failed');
CREATE TYPE empire_rec_type AS ENUM (
  'adjust_bid',
  'adjust_budget',
  'pause_ad',
  'scale_campaign',
  'create_ad_variation',
  'copy_suggestion',
  'landing_page',
  'audience_suggestion',
  'ab_test'
);

CREATE TABLE IF NOT EXISTS public.empire_os_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  allow_auto_optimize BOOLEAN NOT NULL DEFAULT false,
  allow_adjust_bids BOOLEAN NOT NULL DEFAULT false,
  allow_adjust_budgets BOOLEAN NOT NULL DEFAULT false,
  allow_pause_ads BOOLEAN NOT NULL DEFAULT false,
  allow_create_variations BOOLEAN NOT NULL DEFAULT false,
  max_bid_increase_pct NUMERIC(5, 2) NOT NULL DEFAULT 20,
  max_budget_increase_pct NUMERIC(5, 2) NOT NULL DEFAULT 50,
  auto_pause_cpa_threshold NUMERIC(12, 2),
  industry TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.empire_os_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  rec_type empire_rec_type NOT NULL,
  status empire_rec_status NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  expected_impact TEXT NOT NULL,
  confidence NUMERIC(5, 2) NOT NULL,
  payload JSONB DEFAULT '{}',
  issue_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.empire_os_optimization_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES public.empire_os_recommendations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  result TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empire_rec_user_status ON public.empire_os_recommendations(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_empire_rec_campaign ON public.empire_os_recommendations(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_empire_logs_user ON public.empire_os_optimization_logs(user_id, created_at DESC);

-- Dedupe: same issue per campaign per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_empire_rec_daily_dedupe
  ON public.empire_os_recommendations (campaign_id, issue_key, skill_name, rec_type)
  WHERE status = 'pending' AND issue_key IS NOT NULL;

ALTER TABLE public.empire_os_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empire_os_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empire_os_optimization_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own empire settings" ON public.empire_os_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own empire recommendations" ON public.empire_os_recommendations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own empire logs" ON public.empire_os_optimization_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own empire logs" ON public.empire_os_optimization_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
