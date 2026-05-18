export interface ReportAdRow {
  ad_name: string;
  impressions: number;
  ctr: number;
  cpc: number | null;
  conversions: number;
  cpa: number | null;
  spend: number;
  rating: string;
}

export interface DailyMetricRow {
  date: string;
  spend: number;
  conversions: number;
  roas: number | null;
}

import type { ReportBranding, ReportSectionsConfig } from './sections';

export interface ReportRenderOptions {
  sections?: ReportSectionsConfig;
  branding?: ReportBranding;
}

export interface CampaignReportData {
  campaign: {
    id: string;
    name: string;
    platform: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
  };
  period: { start: string; end: string };
  summary: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    roas: number | null;
    ctr: number;
    cpc: number | null;
    cpa: number | null;
    conversion_rate: number;
  };
  daily: DailyMetricRow[];
  ads: ReportAdRow[];
  insights: {
    worked_well: string[];
    improve: string[];
    next_steps: string[];
    empire_os: string[];
  };
  comparison: {
    vs_platform_ctr: string;
    vs_previous_spend: string | null;
    month_over_month_roas: string | null;
  };
  generated_at: string;
}
