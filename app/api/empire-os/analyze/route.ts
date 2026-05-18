import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeAndRecommend } from '@/lib/empire-os/campaign-optimizer';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { campaignId } = body as { campaignId?: string };

    if (campaignId) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      const result = await analyzeAndRecommend(campaignId);
      return NextResponse.json(result);
    }

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused']);

    const results = [];
    for (const c of campaigns ?? []) {
      results.push(await analyzeAndRecommend(c.id));
    }
    return NextResponse.json({ analyzed: results.length, results });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'empire-os/analyze');
    return NextResponse.json(body, { status });
  }
}
