import { createClient } from '@/lib/supabase/server';
import { ConnectPlatformCard } from '@/components/dashboard/connect-platform-card';

const PLATFORM_IDS = ['facebook', 'google', 'tiktok', 'youtube'] as const;

export default async function AdAccountsPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string; accounts?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: adAccounts } = user
    ? await supabase.from('ad_accounts').select('platform').eq('user_id', user.id).eq('is_active', true)
    : { data: [] };

  const counts: Record<string, number> = {};
  for (const id of PLATFORM_IDS) counts[id] = 0;
  adAccounts?.forEach((a) => {
    const p = a.platform as string;
    if (p in counts) counts[p]++;
    if (p === 'instagram') counts.facebook++;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ad accounts</h1>
      <p className="mt-1 text-slate-600">
        Connect platforms to sync campaigns, ads, and performance metrics.
      </p>

      {searchParams.connected && (
        <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
          {searchParams.connected} connected successfully
          {searchParams.accounts ? ` (${searchParams.accounts} accounts)` : ''}.
        </div>
      )}

      {searchParams.error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          Connection failed: {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PLATFORM_IDS.map((id) => (
          <ConnectPlatformCard
            key={id}
            platformId={id}
            connected={counts[id] > 0}
            accountCount={counts[id]}
          />
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Automatic sync</h2>
        <p className="mt-1 text-sm text-slate-600">
          Hourly cron jobs sync Facebook and Google data when{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">CRON_SECRET</code> is configured on
          Vercel.
        </p>
        <ul className="mt-3 text-sm text-slate-500 list-disc list-inside space-y-1">
          <li>GET /api/cron/sync-facebook</li>
          <li>GET /api/cron/sync-google</li>
        </ul>
      </section>
    </div>
  );
}
