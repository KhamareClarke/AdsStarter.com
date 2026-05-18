import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { CampaignReportData, ReportRenderOptions } from './types';
import { formatMoney } from './format';
import { DEFAULT_REPORT_SECTIONS, isSectionEnabled, mergeReportSections } from './sections';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#0f172a' },
  hero: {
    backgroundColor: '#0072ff',
    color: '#fff',
    padding: 20,
    borderRadius: 6,
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 10, opacity: 0.9, marginBottom: 2 },
  h2: {
    fontSize: 14,
    color: '#0072ff',
    marginTop: 18,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  stat: {
    width: '30%',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 4,
    marginBottom: 6,
  },
  statLabel: { fontSize: 8, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: 'bold' },
  li: { marginBottom: 4, paddingLeft: 8 },
  footer: { marginTop: 24, fontSize: 8, color: '#94a3b8', textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 6 },
  tableHead: { fontWeight: 'bold', color: '#64748b', fontSize: 8 },
  col: { flex: 1 },
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function CampaignReportPdfDocument({
  data,
  options = {},
}: {
  data: CampaignReportData;
  options?: ReportRenderOptions;
}) {
  const sections = mergeReportSections(DEFAULT_REPORT_SECTIONS, options.sections);
  const branding = options.branding ?? {};
  const agency = branding.agency_name || 'AdsStarter';
  const s = data.summary;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.title}>{data.campaign.name}</Text>
          <Text style={styles.subtitle}>
            {data.campaign.platform} · {data.campaign.status}
          </Text>
          <Text style={styles.subtitle}>
            {data.period.start} — {data.period.end}
          </Text>
          {branding.client_name ? (
            <Text style={styles.subtitle}>Prepared for: {branding.client_name}</Text>
          ) : null}
          <Text style={styles.subtitle}>Report by {agency}</Text>
        </View>

        {isSectionEnabled(sections, 'executive_summary') ? (
          <View>
            <Text style={styles.h2}>Executive Summary</Text>
            <View style={styles.row}>
              <Stat label="Budget spent" value={formatMoney(s.spend)} />
              <Stat label="Conversions" value={String(s.conversions)} />
              <Stat label="Revenue (est.)" value={formatMoney(s.revenue)} />
              <Stat label="ROAS" value={s.roas != null ? `${s.roas.toFixed(2)}x` : '—'} />
              <Stat label="CTR" value={`${s.ctr.toFixed(2)}%`} />
              <Stat label="CPA" value={s.cpa != null ? formatMoney(s.cpa) : '—'} />
            </View>
          </View>
        ) : null}

        {isSectionEnabled(sections, 'performance_overview') ? (
          <View>
            <Text style={styles.h2}>Performance Overview</Text>
            <View style={styles.row}>
              <Stat label="Impressions" value={s.impressions.toLocaleString()} />
              <Stat label="Clicks" value={s.clicks.toLocaleString()} />
              <Stat label="CPC" value={s.cpc != null ? `$${s.cpc.toFixed(2)}` : '—'} />
              <Stat
                label="Conv. rate"
                value={`${s.conversion_rate.toFixed(2)}%`}
              />
            </View>
          </View>
        ) : null}

        {isSectionEnabled(sections, 'ad_analysis') && data.ads.length > 0 ? (
          <View>
            <Text style={styles.h2}>Ad-Level Analysis</Text>
            <View style={[styles.tableRow, styles.tableHead]}>
              <Text style={styles.col}>Ad</Text>
              <Text style={styles.col}>Impr.</Text>
              <Text style={styles.col}>CTR</Text>
              <Text style={styles.col}>Conv.</Text>
            </View>
            {data.ads.slice(0, 12).map((ad) => (
              <View key={ad.ad_name} style={styles.tableRow}>
                <Text style={styles.col}>{ad.ad_name}</Text>
                <Text style={styles.col}>{ad.impressions.toLocaleString()}</Text>
                <Text style={styles.col}>{ad.ctr.toFixed(2)}%</Text>
                <Text style={styles.col}>{ad.conversions}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {isSectionEnabled(sections, 'insights') ? (
          <View>
            <Text style={styles.h2}>Insights</Text>
            {data.insights.worked_well.map((i) => (
              <Text key={`w-${i}`} style={styles.li}>
                • {i}
              </Text>
            ))}
            {data.insights.improve.map((i) => (
              <Text key={`i-${i}`} style={styles.li}>
                • {i}
              </Text>
            ))}
          </View>
        ) : null}

        {isSectionEnabled(sections, 'comparison') ? (
          <View>
            <Text style={styles.h2}>Comparison</Text>
            <Text style={styles.li}>• {data.comparison.vs_platform_ctr}</Text>
            {data.comparison.vs_previous_spend ? (
              <Text style={styles.li}>• {data.comparison.vs_previous_spend}</Text>
            ) : null}
          </View>
        ) : null}

        {branding.footer_note ? (
          <Text style={styles.footer}>{branding.footer_note}</Text>
        ) : null}
        <Text style={styles.footer}>
          Generated by {agency} · {new Date(data.generated_at).toLocaleString()}
        </Text>
      </Page>
    </Document>
  );
}
