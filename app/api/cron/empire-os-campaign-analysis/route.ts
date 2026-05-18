import { NextRequest, NextResponse } from 'next/server';
import { analyzeAllCampaigns } from '@/lib/empire-os/campaign-optimizer';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { autoOptimizeCampaign } from '@/lib/empire-os/auto-optimizer';

async function runCron(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const analysis = await analyzeAllCampaigns();

  const supabase = createAdminSupabase();
  const { data: autoUsers } = await supabase
    .from('empire_os_settings')
    .select('user_id')
    .eq('allow_auto_optimize', true);

  const autoResults = [];
  for (const u of autoUsers ?? []) {
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', u.user_id)
      .eq('status', 'active');

    for (const c of campaigns ?? []) {
      autoResults.push({
        campaignId: c.id,
        ...(await autoOptimizeCampaign(c.id, u.user_id)),
      });
    }
  }

  return NextResponse.json({
    success: true,
    analyzed: analysis.length,
    analysis,
    autoOptimized: autoResults,
  });
}

export async function GET(request: NextRequest) {
  return runCron(request);
}

export async function POST(request: NextRequest) {
  return runCron(request);
}
