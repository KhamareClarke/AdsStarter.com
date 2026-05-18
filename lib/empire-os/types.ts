export type EmpireSkillName =
  | 'paid-ads'
  | 'ad-creative'
  | 'ab-test-setup'
  | 'pricing-strategy'
  | 'launch-strategy'
  | 'email-sequence'
  | 'copy-editing'
  | 'copywriting'
  | 'marketing-ideas'
  | 'page-cro'
  | 'form-cro'
  | 'popup-cro'
  | 'onboarding-cro'
  | 'free-tool-strategy';

export type EmpireRecType =
  | 'adjust_bid'
  | 'adjust_budget'
  | 'pause_ad'
  | 'scale_campaign'
  | 'create_ad_variation'
  | 'copy_suggestion'
  | 'landing_page'
  | 'audience_suggestion'
  | 'ab_test';

export type CampaignIssue =
  | 'low_roas'
  | 'low_ctr'
  | 'high_cpa'
  | 'low_conversions'
  | 'scale_opportunity'
  | 'budget_underutilized';

export interface CampaignMetricsSnapshot {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  cpc: number | null;
  cpa: number | null;
  roas: number | null;
  ctr: number;
  conversion_rate: number;
}

export interface IndustryBenchmarks {
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  conversion_rate: number;
}

export interface EmpireRecommendationInput {
  skill: EmpireSkillName;
  type: EmpireRecType;
  title: string;
  action: string;
  reason: string;
  expected_impact: string;
  confidence: number;
  issue_key: string;
  payload?: Record<string, unknown>;
}

export interface StoredRecommendation extends EmpireRecommendationInput {
  id: string;
  campaign_id: string;
  status: string;
  created_at: string;
}
