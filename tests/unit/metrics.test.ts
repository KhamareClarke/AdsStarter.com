import {
  calcConversionRate,
  calcCpa,
  calcCpc,
  calcCtr,
  calcPaybackDays,
  calcProfit,
  calcProfitPerAcquisition,
  calcRoi,
  calcRoas,
  starRating,
} from '@/lib/reports/metrics';

describe('metric calculations', () => {
  it('calculates CPC', () => {
    expect(calcCpc(100, 400)).toBe(0.25);
    expect(calcCpc(100, 0)).toBeNull();
  });

  it('calculates CPA', () => {
    expect(calcCpa(1200, 200)).toBe(6);
    expect(calcCpa(100, 0)).toBeNull();
  });

  it('calculates CTR as percentage', () => {
    expect(calcCtr(4500, 100000)).toBe(4.5);
  });

  it('calculates conversion rate', () => {
    expect(calcConversionRate(50, 1000)).toBe(5);
  });

  it('calculates ROAS', () => {
    expect(calcRoas(12150, 5247)).toBeCloseTo(2.316, 2);
    expect(calcRoas(0, 0)).toBeNull();
  });

  it('calculates ROI and profit', () => {
    const profit = calcProfit(12150, 5247);
    expect(profit).toBe(6903);
    expect(calcRoi(profit, 5247)).toBeCloseTo(131.56, 0);
  });

  it('calculates profit per acquisition', () => {
    expect(calcProfitPerAcquisition(6903, 342)).toBeCloseTo(20.18, 1);
  });

  it('calculates payback days', () => {
    expect(calcPaybackDays(5247, 6903 / 30)).toBe(23);
    expect(calcPaybackDays(100, 0)).toBeNull();
  });

  it('assigns star ratings vs benchmark', () => {
    expect(starRating(4.5, 1.2)).toContain('⭐');
    expect(starRating(0.5, 1.2)).toBe('⭐');
  });
});
