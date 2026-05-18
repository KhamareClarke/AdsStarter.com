import type { CampaignReportData, ReportRenderOptions } from './types';
import { formatMoney } from './format';
import { DEFAULT_REPORT_SECTIONS, isSectionEnabled, mergeReportSections } from './sections';
import { escapeHtml } from './escape';

function barChart(values: number[], labels: string[], color: string, maxH = 120): string {
  const max = Math.max(...values, 1);
  return values
    .map((v, i) => {
      const h = Math.round((v / max) * maxH);
      return `<motionDiv style="flex:1;text-align:center"><motionDiv style="background:${color};height:${h}px;border-radius:4px 4px 0 0;margin:0 auto;width:80%"></motionDiv><motionDiv style="font-size:10px;color:#64748b;margin-top:4px">${labels[i]}</motionDiv></motionDiv>`;
    })
    .join('');
}

export function buildCampaignReportHtml(
  data: CampaignReportData,
  options: ReportRenderOptions = {}
): string {
  const sections = mergeReportSections(DEFAULT_REPORT_SECTIONS, options.sections);
  const branding = options.branding ?? {};
  const s = data.summary;
  const agency = branding.agency_name ? escapeHtml(branding.agency_name) : 'AdsStarter';
  const clientLine = branding.client_name
    ? `<p>Prepared for: ${escapeHtml(branding.client_name)}</p>`
    : '';
  const footerNote = branding.footer_note
    ? `<p class="footer">${escapeHtml(branding.footer_note)}</p>`
    : '';

  const dailyLabels = data.daily.map((d) => d.date.slice(5));
  const spendBars = barChart(data.daily.map((d) => d.spend), dailyLabels, '#0072ff');
  const roasBars = barChart(data.daily.map((d) => d.roas ?? 0), dailyLabels, '#00c6ff');

  const adTable = data.ads
    .map(
      (a) => `<tr>
        <td>${escapeHtml(a.ad_name)}</td>
        <td>${a.impressions.toLocaleString()}</td>
        <td>${a.ctr.toFixed(2)}%</td>
        <td>${a.cpc != null ? `$${a.cpc.toFixed(2)}` : '—'}</td>
        <td>${a.conversions}</td>
        <td>${a.cpa != null ? `$${a.cpa.toFixed(2)}` : '—'}</td>
        <td>${a.rating}</td>
      </tr>`
    )
    .join('');

  const noDataBanner =
    data.summary.impressions === 0 && data.summary.spend === 0
      ? `<motionDiv style="background:#fef3c7;border:1px solid #fcd34d;padding:12px 16px;border-radius:8px;margin-bottom:24px;font-size:13px">
        No metrics synced for this period. Connect your ad account and run sync to populate this report.
      </motionDiv>`
      : '';

  const executiveBlock = isSectionEnabled(sections, 'executive_summary')
    ? `<h2>Executive Summary</h2>
    <motionDiv class="grid">
      <motionDiv class="stat"><label>Budget spent</label><strong>${formatMoney(s.spend)}</strong></motionDiv>
      <motionDiv class="stat"><label>Conversions</label><strong>${s.conversions}</strong></motionDiv>
      <motionDiv class="stat"><label>Revenue (est.)</label><strong>${formatMoney(s.revenue)}</strong></motionDiv>
      <motionDiv class="stat"><label>ROAS</label><strong>${s.roas != null ? `${s.roas.toFixed(2)}x` : '—'}</strong></motionDiv>
      <motionDiv class="stat"><label>CTR</label><strong>${s.ctr.toFixed(2)}%</strong></motionDiv>
      <motionDiv class="stat"><label>CPA</label><strong>${s.cpa != null ? formatMoney(s.cpa) : '—'}</strong></motionDiv>
    </motionDiv>`
    : '';

  const performanceBlock = isSectionEnabled(sections, 'performance_overview')
    ? `<h2>Performance Overview</h2>
    <motionDiv class="grid">
      <motionDiv class="stat"><label>Impressions</label><strong>${s.impressions.toLocaleString()}</strong></motionDiv>
      <motionDiv class="stat"><label>Clicks</label><strong>${s.clicks.toLocaleString()}</strong></motionDiv>
      <motionDiv class="stat"><label>CPC</label><strong>${s.cpc != null ? `$${s.cpc.toFixed(2)}` : '—'}</strong></motionDiv>
      <motionDiv class="stat"><label>Conv. rate</label><strong>${s.conversion_rate.toFixed(2)}%</strong></motionDiv>
    </motionDiv>`
    : '';

  const chartsBlock =
    isSectionEnabled(sections, 'charts') && data.daily.length > 0
      ? `<motionDiv class="charts">
      <motionDiv class="chart-box"><h3>Daily spend</h3><motionDiv class="chart-row">${spendBars}</motionDiv></motionDiv>
      <motionDiv class="chart-box"><h3>ROAS trend</h3><motionDiv class="chart-row">${roasBars}</motionDiv></motionDiv>
    </motionDiv>`
      : '';

  const adsBlock = isSectionEnabled(sections, 'ad_analysis')
    ? `<h2>Ad-Level Analysis</h2>
    <table>
      <thead><tr><th>Ad</th><th>Impressions</th><th>CTR</th><th>CPC</th><th>Conv.</th><th>CPA</th><th>Rating</th></tr></thead>
      <tbody>${adTable || '<tr><td colspan="7">No ads synced yet</td></tr>'}</tbody>
    </table>`
    : '';

  const insightsBlock = isSectionEnabled(sections, 'insights')
    ? `<h2>Insights & Recommendations</h2>
    <p><strong>What worked well</strong></p><ul>${data.insights.worked_well.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    <p><strong>Could improve</strong></p><ul>${data.insights.improve.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    <p><strong>Next steps</strong></p><ul>${data.insights.next_steps.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    ${data.insights.empire_os.length ? `<p><strong>Empire OS</strong></p><ul>${data.insights.empire_os.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : ''}`
    : '';

  const comparisonBlock = isSectionEnabled(sections, 'comparison')
    ? `<h2>Comparison</h2>
    <ul>
      <li>Platform: ${escapeHtml(data.comparison.vs_platform_ctr)}</li>
      ${data.comparison.vs_previous_spend ? `<li>Other campaigns: ${escapeHtml(data.comparison.vs_previous_spend)}</li>` : ''}
      ${data.comparison.month_over_month_roas ? `<li>${escapeHtml(data.comparison.month_over_month_roas)}</li>` : ''}
    </ul>`
    : '';

  const bodySections = [
    executiveBlock,
    performanceBlock,
    chartsBlock,
    adsBlock,
    insightsBlock,
    comparisonBlock,
  ]
    .filter(Boolean)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Campaign Report — ${escapeHtml(data.campaign.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; background: #f8fafc; }
    .page { max-width: 900px; margin: 0 auto; background: #fff; padding: 48px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.06); }
    h1 { margin: 0 0 8px; font-size: 28px; }
    h2 { margin: 32px 0 16px; font-size: 18px; color: #0072ff; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .hero { background: linear-gradient(135deg, #00c6ff, #0072ff); color: #fff; padding: 32px; border-radius: 8px; margin-bottom: 32px; }
    .hero p { margin: 4px 0; opacity: .95; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .stat { background: #f1f5f9; padding: 16px; border-radius: 8px; }
    .stat label { font-size: 12px; color: #64748b; display: block; }
    .stat strong { font-size: 22px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #f8fafc; color: #64748b; font-weight: 600; }
    .charts { display: flex; gap: 24px; margin-top: 16px; }
    .chart-box { flex: 1; }
    .chart-box h3 { font-size: 14px; margin: 0 0 8px; }
    .chart-row { display: flex; align-items: flex-end; gap: 4px; height: 140px; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin: 6px 0; }
    .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
    @media print { body { background: #fff; padding: 0; } .page { box-shadow: none; } .no-print { display: none; } }
  </style>
</head>
<body>
  <motionDiv class="page">
    <motionDiv class="hero">
      <h1 style="color:#fff">${escapeHtml(data.campaign.name)}</h1>
      <p>Platform: ${escapeHtml(data.campaign.platform)} · Status: ${escapeHtml(data.campaign.status)}</p>
      <p>Period: ${data.period.start} — ${data.period.end}</p>
      ${clientLine}
      <p style="font-size:12px;opacity:.85">Report by ${agency}</p>
    </motionDiv>
    ${noDataBanner}
    ${bodySections}
    ${footerNote}
    <p class="footer">Generated by ${agency} · ${new Date(data.generated_at).toLocaleString()}</p>
  </motionDiv>
  <p class="no-print" style="text-align:center;margin-top:24px">
    <button onclick="window.print()" style="padding:12px 24px;background:#0072ff;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">Print / Save as PDF</button>
  </p>
</body>
</html>`.replace(/motionDiv/g, 'div');
}
