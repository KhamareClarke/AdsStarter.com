import { pdf } from '@react-pdf/renderer';
import type { CampaignReportData, ReportRenderOptions } from './types';
import { CampaignReportPdfDocument } from './campaign-report-pdf';

export async function generateCampaignReportPdf(
  data: CampaignReportData,
  options: ReportRenderOptions = {}
): Promise<Buffer> {
  const blob = await pdf(
    <CampaignReportPdfDocument data={data} options={options} />
  ).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
