const fs = require('fs');
const path = 'lib/reports/campaign-report-generator.ts';
let s = fs.readFileSync(path, 'utf8');
const cut = s.indexOf('\nfunction barChart');
if (cut === -1) {
  console.error('barChart not found');
  process.exit(1);
}
s =
  s.slice(0, cut) +
  `\nimport { buildCampaignReportHtml } from './build-report-html';\n\nexport function generateCampaignReportHtml(\n  data: import('./types').CampaignReportData,\n  options: import('./types').ReportRenderOptions = {}\n) {\n  return buildCampaignReportHtml(data, options);\n}\n`;
fs.writeFileSync(path, s);
console.log('truncated and re-exported');
