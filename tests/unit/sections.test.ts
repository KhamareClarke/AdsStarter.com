import { DEFAULT_REPORT_SECTIONS, mergeReportSections } from '@/lib/reports/sections';

describe('report sections', () => {
  it('merges defaults with overrides', () => {
    const merged = mergeReportSections(DEFAULT_REPORT_SECTIONS, { charts: false });
    expect(merged.charts).toBe(false);
    expect(merged.executive_summary).toBe(true);
  });
});
