import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setupUserWorkflows, type WorkflowType } from '@/lib/ghl/workflows';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new AppError('Unauthorized', 401);

    const body = await request.json();
    const {
      campaignId,
      workflowType,
      preferredTime,
      roasThreshold,
      enableWeekly,
    } = body as {
      campaignId: string;
      workflowType?: WorkflowType;
      preferredTime?: string;
      roasThreshold?: number;
      enableWeekly?: boolean;
    };

    if (!campaignId) throw new AppError('campaignId is required', 400);

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!campaign) throw new AppError('Campaign not found', 404);

    const { data: settings } = await supabase
      .from('user_alert_settings')
      .upsert(
        {
          user_id: user.id,
          daily_report_time: preferredTime ?? '09:00:00',
          roas_threshold: roasThreshold ?? 2,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    const workflows = await setupUserWorkflows(user.id, campaignId, {
      dailyReportTime: preferredTime ?? settings?.daily_report_time?.slice(0, 5) ?? '09:00',
      roasThreshold: roasThreshold ?? Number(settings?.roas_threshold ?? 2),
      enableWeekly: enableWeekly ?? true,
    });

    return NextResponse.json({
      success: true,
      workflow_ids: workflows.map((w) => w.id),
      workflow_type: workflowType ?? 'all',
    });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/ghl/workflows/setup');
    return NextResponse.json(body, { status });
  }
}
