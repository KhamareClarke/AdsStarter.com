import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import {
  fetchCampaignReportData,
  generateCampaignReportHtml,
} from '@/lib/reports/campaign-report-generator';
import { generateCampaignReportPdf } from '@/lib/reports/generate-campaign-pdf';
import { getCampaignReportSettings } from '@/lib/reports/settings';
import { verifyReportShareToken } from '@/lib/reports/share-token';
import { handleApiError } from '@/lib/error-handler';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const format = searchParams.get('format') ?? 'html';
    const aov = searchParams.get('aov');

    if (!token) {
      return NextResponse.json({ error: 'Missing share token' }, { status: 401 });
    }

    const supabase = createAdminSupabase();
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('id, user_id')
      .eq('id', params.id)
      .single();

    if (error || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (!verifyReportShareToken(campaign.id, campaign.user_id, token)) {
      return NextResponse.json({ error: 'Invalid share token' }, { status: 403 });
    }

    const reportSettings = await getCampaignReportSettings(campaign.user_id, campaign.id);
    const revenuePerConversion = aov
      ? parseFloat(aov)
      : reportSettings.default_aov;

    const data = await fetchCampaignReportData(campaign.id, campaign.user_id, {
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

    const safeName = data.campaign.name.replace(/[^a-z0-9-_]+/gi, '-').slice(0, 60);

    if (format === 'pdf') {
      const pdf = await generateCampaignReportPdf(data, renderOptions);
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="campaign-report-${safeName}.pdf"`,
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    const html = generateCampaignReportHtml(data, renderOptions);
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'reports/share');
    return NextResponse.json(body, { status });
  }
}
