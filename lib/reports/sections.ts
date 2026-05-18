export const REPORT_SECTION_KEYS = [
  'executive_summary',
  'performance_overview',
  'charts',
  'ad_analysis',
  'insights',
  'comparison',
] as const;

export type ReportSectionKey = (typeof REPORT_SECTION_KEYS)[number];

export type ReportSectionsConfig = Record<ReportSectionKey, boolean>;

export const DEFAULT_REPORT_SECTIONS: ReportSectionsConfig = {
  executive_summary: true,
  performance_overview: true,
  charts: true,
  ad_analysis: true,
  insights: true,
  comparison: true,
};

export interface ReportBranding {
  agency_name?: string | null;
  client_name?: string | null;
  footer_note?: string | null;
}

export function mergeReportSections(
  base: Partial<ReportSectionsConfig> | null | undefined,
  override: Partial<ReportSectionsConfig> | null | undefined
): ReportSectionsConfig {
  return {
    ...DEFAULT_REPORT_SECTIONS,
    ...base,
    ...override,
  };
}

export function isSectionEnabled(
  sections: ReportSectionsConfig,
  key: ReportSectionKey
): boolean {
  return sections[key] !== false;
}

export const REPORT_SECTION_LABELS: Record<ReportSectionKey, string> = {
  executive_summary: 'Executive summary',
  performance_overview: 'Performance overview',
  charts: 'Daily charts (spend & ROAS)',
  ad_analysis: 'Ad-level analysis',
  insights: 'Insights & recommendations',
  comparison: 'Benchmark comparison',
};
