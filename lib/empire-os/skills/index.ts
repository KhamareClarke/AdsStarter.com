import type { DetectedIssue } from '../issues';
import type { CampaignMetricsSnapshot, EmpireRecommendationInput } from '../types';

interface SkillContext {
  campaignName: string;
  platform: string;
  metrics: CampaignMetricsSnapshot;
  issue: DetectedIssue;
  dailyBudget?: number | null;
}

export function runEmpireSkills(ctx: SkillContext): EmpireRecommendationInput[] {
  const recs: EmpireRecommendationInput[] = [];
  const runners: Record<string, (c: SkillContext) => EmpireRecommendationInput[]> = {
    low_roas: runLowRoasSkills,
    low_ctr: runLowCtrSkills,
    high_cpa: runHighCpaSkills,
    low_conversions: runLowConversionSkills,
    scale_opportunity: runScaleSkills,
  };

  const fn = runners[ctx.issue.key];
  if (fn) recs.push(...fn(ctx));
  return recs;
}

function runLowRoasSkills(ctx: SkillContext): EmpireRecommendationInput[] {
  const bidCut = 15;
  return [
    {
      skill: 'paid-ads',
      type: 'adjust_bid',
      title: 'Reduce bids to improve ROAS',
      action: `Decrease bids by ~${bidCut}% on underperforming ad sets`,
      reason: `${ctx.issue.detail}. Paid Ads skill: tighten audience or lower bids before pausing.`,
      expected_impact: 'Lower CPA, ROAS may improve 10–20% within 3–5 days',
      confidence: 82,
      issue_key: ctx.issue.key,
      payload: { percentChange: -bidCut },
    },
    {
      skill: 'pricing-strategy',
      type: 'adjust_budget',
      title: 'Reallocate budget from weak placements',
      action: 'Shift 20% of daily budget to top-performing ad sets only',
      reason: 'Pricing Strategy: concentrate spend where marginal ROAS is highest.',
      expected_impact: 'Portfolio ROAS lift ~8–15%',
      confidence: 75,
      issue_key: ctx.issue.key,
      payload: { reallocatePct: 20 },
    },
  ];
}

function runLowCtrSkills(ctx: SkillContext): EmpireRecommendationInput[] {
  return [
    {
      skill: 'ad-creative',
      type: 'create_ad_variation',
      title: 'Refresh ad creative',
      action: 'Launch 2 new headline + image variations for A/B test',
      reason: `${ctx.issue.detail}. Ad Creative skill recommends new hooks and thumb-stopping visuals.`,
      expected_impact: 'CTR improvement 15–35% typical after creative refresh',
      confidence: 78,
      issue_key: ctx.issue.key,
      payload: { variations: 2 },
    },
    {
      skill: 'copywriting',
      type: 'copy_suggestion',
      title: 'Test urgency-led primary text',
      action: 'Add benefit-first headline with clear CTA in first 125 characters',
      reason: 'Copywriting: lead with outcome, not feature list.',
      expected_impact: '+10–20% CTR on cold audiences',
      confidence: 70,
      issue_key: ctx.issue.key,
    },
    {
      skill: 'ab-test-setup',
      type: 'ab_test',
      title: 'Structured A/B test',
      action: 'Run 50/50 split on headline for 7 days, 500+ clicks per variant',
      reason: 'A/B Test Setup: isolate one variable for statistical clarity.',
      expected_impact: 'Identify winning creative with 90%+ confidence',
      confidence: 85,
      issue_key: ctx.issue.key,
    },
  ];
}

function runHighCpaSkills(ctx: SkillContext): EmpireRecommendationInput[] {
  return [
    {
      skill: 'paid-ads',
      type: 'pause_ad',
      title: 'Pause highest-CPA ads',
      action: 'Pause bottom 20% of ads by CPA in this campaign',
      reason: `${ctx.issue.detail}. Paid Ads: stop bleeders before scaling winners.`,
      expected_impact: 'CPA reduction 12–25%',
      confidence: 80,
      issue_key: ctx.issue.key,
      payload: { pauseBottomPct: 20 },
    },
    {
      skill: 'marketing-ideas',
      type: 'audience_suggestion',
      title: 'Narrow audience targeting',
      action: 'Add interest layering or switch to lookalike 1–3% from converters',
      reason: 'Marketing Ideas: tighter intent beats broad reach when CPA spikes.',
      expected_impact: 'CPA down 15–30% after audience refinement',
      confidence: 72,
      issue_key: ctx.issue.key,
    },
  ];
}

function runLowConversionSkills(ctx: SkillContext): EmpireRecommendationInput[] {
  return [
    {
      skill: 'page-cro',
      type: 'landing_page',
      title: 'Optimize landing page above the fold',
      action: 'Match headline to ad copy; add single primary CTA above fold',
      reason: `${ctx.issue.detail}. Page CRO: message match drives conversion rate.`,
      expected_impact: '+15–40% landing page conversion rate',
      confidence: 77,
      issue_key: ctx.issue.key,
    },
    {
      skill: 'form-cro',
      type: 'landing_page',
      title: 'Shorten lead form',
      action: 'Reduce to 3 fields max; enable autofill',
      reason: 'Form CRO: each extra field costs ~10% completions.',
      expected_impact: '+8–20% form submissions',
      confidence: 74,
      issue_key: ctx.issue.key,
    },
    {
      skill: 'popup-cro',
      type: 'copy_suggestion',
      title: 'Align exit intent with offer',
      action: 'Test exit popup with same offer as ad for consistency',
      reason: 'Popup CRO: recover abandoning visitors without hurting core flow.',
      expected_impact: '+5–12% recovered leads',
      confidence: 65,
      issue_key: ctx.issue.key,
    },
  ];
}

function runScaleSkills(ctx: SkillContext): EmpireRecommendationInput[] {
  const increase = 15;
  return [
    {
      skill: 'paid-ads',
      type: 'scale_campaign',
      title: 'Scale winning campaign',
      action: `Increase daily budget by ${increase}%`,
      reason: `${ctx.issue.detail}. Paid Ads: scale when ROAS and CPC have headroom.`,
      expected_impact: `+${Math.round(increase * 0.8)}–${increase}% conversions at similar ROAS`,
      confidence: 85,
      issue_key: ctx.issue.key,
      payload: { percentChange: increase },
    },
    {
      skill: 'launch-strategy',
      type: 'adjust_budget',
      title: 'Phased budget ramp',
      action: 'Increase budget 15% every 48h while ROAS holds above target',
      reason: 'Launch Strategy: avoid shocking the algorithm with 2x overnight jumps.',
      expected_impact: 'Sustainable scale without ROAS collapse',
      confidence: 80,
      issue_key: ctx.issue.key,
      payload: { rampPct: 15, intervalHours: 48 },
    },
  ];
}

export const AD_RELATED_SKILLS = [
  'paid-ads',
  'ad-creative',
  'ab-test-setup',
  'pricing-strategy',
  'launch-strategy',
  'copy-editing',
  'copywriting',
  'marketing-ideas',
  'page-cro',
  'form-cro',
  'popup-cro',
  'onboarding-cro',
  'free-tool-strategy',
  'email-sequence',
] as const;
