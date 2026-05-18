import { NextRequest, NextResponse } from 'next/server';
import { checkAllCampaignAlerts, sendDailyReports } from '@/lib/ghl/alerts';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [alertResults, dailyReports] = await Promise.all([
    checkAllCampaignAlerts(),
    sendDailyReports(),
  ]);

  return NextResponse.json({
    success: true,
    campaigns_checked: alertResults.length,
    alert_results: alertResults,
    daily_reports_sent: dailyReports.sent,
  });
}
