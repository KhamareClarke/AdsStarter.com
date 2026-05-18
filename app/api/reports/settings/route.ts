import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserReportSettings, saveUserReportSettings } from '@/lib/reports/settings';
import { handleApiError } from '@/lib/error-handler';
import type { ReportSettings } from '@/lib/reports/settings';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settings = await getUserReportSettings(user.id);
    return NextResponse.json({ settings });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'reports/settings GET');
    return NextResponse.json(body, { status });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as Partial<ReportSettings>;
    const settings = await saveUserReportSettings(user.id, body);
    return NextResponse.json({ settings });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'reports/settings PUT');
    return NextResponse.json(body, { status });
  }
}
