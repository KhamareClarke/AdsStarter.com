export function calcCpc(spend: number, clicks: number): number | null {
  return clicks > 0 ? spend / clicks : null;
}

export function calcCpa(spend: number, conversions: number): number | null {
  return conversions > 0 ? spend / conversions : null;
}

export function calcCtr(clicks: number, impressions: number): number {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
}

export function calcConversionRate(conversions: number, clicks: number): number {
  return clicks > 0 ? (conversions / clicks) * 100 : 0;
}

export function calcRoas(revenue: number, spend: number): number | null {
  return spend > 0 ? revenue / spend : null;
}

export function calcRoi(profit: number, spend: number): number | null {
  return spend > 0 ? (profit / spend) * 100 : null;
}

export function calcProfit(revenue: number, spend: number): number {
  return revenue - spend;
}

export function calcProfitPerAcquisition(profit: number, conversions: number): number | null {
  return conversions > 0 ? profit / conversions : null;
}

export function calcPaybackDays(spend: number, dailyProfit: number): number | null {
  if (dailyProfit <= 0) return null;
  return Math.ceil(spend / dailyProfit);
}

export function starRating(value: number, benchmark: number, higherIsBetter = true): string {
  const ratio = benchmark > 0 ? value / benchmark : 0;
  const score = higherIsBetter ? ratio : benchmark / (value || 1);
  if (score >= 1.2) return '⭐⭐⭐⭐⭐';
  if (score >= 1.0) return '⭐⭐⭐⭐';
  if (score >= 0.8) return '⭐⭐⭐';
  if (score >= 0.6) return '⭐⭐';
  return '⭐';
}
