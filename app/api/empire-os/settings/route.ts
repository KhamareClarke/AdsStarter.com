import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('empire_os_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ settings: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('empire_os_settings')
    .upsert(
      {
        user_id: user.id,
        allow_auto_optimize: body.allow_auto_optimize ?? false,
        allow_adjust_bids: body.allow_adjust_bids ?? false,
        allow_adjust_budgets: body.allow_adjust_budgets ?? false,
        allow_pause_ads: body.allow_pause_ads ?? false,
        allow_create_variations: body.allow_create_variations ?? false,
        max_bid_increase_pct: body.max_bid_increase_pct ?? 20,
        max_budget_increase_pct: body.max_budget_increase_pct ?? 50,
        auto_pause_cpa_threshold: body.auto_pause_cpa_threshold ?? null,
        industry: body.industry ?? 'general',
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, settings: data });
}
