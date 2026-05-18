import { createClient } from '@/lib/supabase/server';
import { EmpireOsPanel } from '@/components/dashboard/empire-os-panel';
import { EmpireOsSettingsForm } from '@/components/dashboard/empire-os-settings-form';

export const metadata = { title: 'Empire OS | AdsStarter' };

export default async function EmpireOsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await supabase.from('empire_os_settings').upsert({ user_id: user.id }, { onConflict: 'user_id' });

  const { data: settings } = await supabase
    .from('empire_os_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

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

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Empire OS</h1>
        <p className="mt-1 text-slate-600">
          AI-powered campaign optimization using 14+ marketing skills — analyzes performance
          every 4 hours.
        </p>
      </header>

      <EmpireOsPanel
        initialPending={(pending ?? []) as never[]}
        initialApplied={(applied ?? []) as never[]}
        stats={{
          total: total ?? 0,
          accepted: accepted ?? 0,
          declined: declined ?? 0,
          acceptanceRate: total ? Math.round(((accepted ?? 0) / total) * 100) : 0,
        }}
      />

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Auto-optimization controls</h2>
        <EmpireOsSettingsForm initial={settings} />
      </section>
    </div>
  );
}
