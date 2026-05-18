import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendCampaignAlert, type CampaignAlertType, type AlertMetrics } from '@/lib/ghl/sms';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const userId = body.userId ?? user?.id;
    const { campaignId, alertType, metrics } = body as {
      campaignId: string;
      alertType: CampaignAlertType;
      metrics: AlertMetrics;
    };

    if (!userId || !campaignId || !alertType) {
      throw new AppError('userId, campaignId, and alertType are required', 400);
    }

    if (user && user.id !== userId) {
      throw new AppError('Forbidden', 403);
    }

    const cronSecret = request.headers.get('authorization');
    if (!user && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      throw new AppError('Unauthorized', 401);
    }

    const result = await sendCampaignAlert(userId, campaignId, alertType, metrics ?? {});

    return NextResponse.json({
      success: true,
      message_id: result.message_id,
      skipped: 'skipped' in result ? result.skipped : false,
    });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/notifications/ghl-sms');
    return NextResponse.json(body, { status });
  }
}
