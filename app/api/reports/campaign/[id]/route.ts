import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchCampaignReportData,
  generateCampaignReportHtml,
} from '@/lib/reports/campaign-report-generator';
import { generateCampaignReportPdf } from '@/lib/reports/generate-campaign-pdf';
import { getCampaignReportSettings } from '@/lib/reports/settings';
import { createReportShareToken } from '@/lib/reports/share-token';
import { handleApiError } from '@/lib/error-handler';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') ?? 'html';
    const aovParam = searchParams.get('aov');

    const reportSettings = await getCampaignReportSettings(user.id, params.id);
    const revenuePerConversion = aovParam
      ? parseFloat(aovParam)
      : reportSettings.default_aov;

    const data = await fetchCampaignReportData(params.id, user.id, {
      revenuePerConversion:
        revenuePerConversion && !Number.isNaN(revenuePerConversion)
          ? revenuePerConversion
          : reportSettings.default_aov,
    });

    const renderOptions = {
      sections: reportSettings.sections,
      branding: {
        agency_name: reportSettings.agency_name,
        client_name: reportSettings.client_name,
        footer_note: reportSettings.footer_note,
      },
    };

    if (format === 'json') {
      return NextResponse.json({
        data,
        shareToken: createReportShareToken(params.id, user.id),
        settings: reportSettings,
      });
    }

    const safeName = data.campaign.name.replace(/[^a-z0-9-_]+/gi, '-').slice(0, 60);

    if (format === 'pdf') {
      const pdf = await generateCampaignReportPdf(data, renderOptions);
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="campaign-report-${safeName}.pdf"`,
          'Cache-Control': 'private, max-age=60',
        },
      });
    }

    const html = generateCampaignReportHtml(data, renderOptions);
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'reports/campaign');
    return NextResponse.json(body, { status });
  }
}
