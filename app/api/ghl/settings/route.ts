import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new AppError('Unauthorized', 401);

    const body = await request.json();
    const time = body.daily_report_time
      ? `${body.daily_report_time}:00`.slice(0, 8)
      : '09:00:00';

    const { data, error } = await supabase
      .from('user_alert_settings')
      .upsert(
        {
          user_id: user.id,
          phone: body.phone ?? null,
          roas_threshold: body.roas_threshold ?? 2,
          conversion_drop_pct: body.conversion_drop_pct ?? 30,
          budget_warning_pct: body.budget_warning_pct ?? 80,
          auto_pause_on_budget: body.auto_pause_on_budget ?? false,
          daily_report_time: time,
          sms_enabled: body.sms_enabled ?? true,
          email_enabled: body.email_enabled ?? true,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, settings: data });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/ghl/settings');
    return NextResponse.json(body, { status });
  }
}
