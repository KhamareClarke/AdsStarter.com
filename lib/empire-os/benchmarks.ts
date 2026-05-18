import type { IndustryBenchmarks } from './types';

const BENCHMARKS: Record<string, IndustryBenchmarks> = {
  general: { ctr: 1.2, cpc: 2.5, cpa: 45, roas: 2.5, conversion_rate: 2.5 },
  ecommerce: { ctr: 1.5, cpc: 1.8, cpa: 35, roas: 3.0, conversion_rate: 3.0 },
  saas: { ctr: 0.9, cpc: 4.5, cpa: 80, roas: 2.0, conversion_rate: 1.8 },
  local: { ctr: 2.0, cpc: 3.0, cpa: 40, roas: 2.8, conversion_rate: 4.0 },
};

export function getBenchmarks(industry = 'general'): IndustryBenchmarks {
  return BENCHMARKS[industry] ?? BENCHMARKS.general;
}
