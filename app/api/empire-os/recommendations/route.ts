import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pending } = await supabase
    .from('empire_os_recommendations')
    .select('*, campaigns(campaign_name, platform)')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const { data: applied } = await supabase
    .from('empire_os_optimization_logs')
    .select('*, campaigns(campaign_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const { count: total } = await supabase
    .from('empire_os_recommendations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: accepted } = await supabase
    .from('empire_os_recommendations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['accepted', 'applied']);

  const { count: declined } = await supabase
    .from('empire_os_recommendations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'declined');

  return NextResponse.json({
    pending: pending ?? [],
    applied: applied ?? [],
    stats: {
      total: total ?? 0,
      accepted: accepted ?? 0,
      declined: declined ?? 0,
      acceptanceRate: total ? Math.round(((accepted ?? 0) / total) * 100) : 0,
    },
  });
}
