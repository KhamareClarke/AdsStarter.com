import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/db/queries';
import { GhlSettings } from '@/components/dashboard/ghl-settings';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getProfile(user.id);

  const { data: alertSettings } = await supabase
    .from('user_alert_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const defaults = {
    phone: alertSettings?.phone ?? undefined,
    roas_threshold: Number(alertSettings?.roas_threshold ?? 2),
    conversion_drop_pct: Number(alertSettings?.conversion_drop_pct ?? 30),
    budget_warning_pct: Number(alertSettings?.budget_warning_pct ?? 80),
    auto_pause_on_budget: alertSettings?.auto_pause_on_budget ?? false,
    daily_report_time: alertSettings?.daily_report_time ?? '09:00:00',
    sms_enabled: alertSettings?.sms_enabled ?? true,
    email_enabled: alertSettings?.email_enabled ?? true,
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="mt-1 text-slate-600">Account and integration preferences.</p>

      <div className="mt-6 space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{profile?.email ?? user.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{profile?.full_name || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Subscription</dt>
              <dd className="font-medium capitalize text-slate-900">{profile?.subscription_tier ?? 'free'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Go High Level alerts</h2>
          <p className="mt-1 text-sm text-slate-500">
            SMS and email notifications for budget, ROAS, and performance events.
          </p>
          <div className="mt-4">
            <GhlSettings initial={defaults} hasGhlContact={!!profile?.ghl_contact_id} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Admin</h2>
          <p className="mt-2 text-sm text-slate-500">
            <a href="/admin/ghl-notifications" className="text-[#0072ff] hover:underline">
              GHL notification dashboard
            </a>{' '}
            (requires ADMIN_EMAILS env)
          </p>
        </section>
      </div>
    </div>
  );
}
