import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats, getProfile, getUserCampaigns } from '@/lib/db/queries';
import { getPerformanceKpis } from '@/lib/db/campaign-queries';
import { formatMoney } from '@/lib/reports/format';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getProfile(user.id);
  const stats = await getDashboardStats(user.id);
  const kpis = await getPerformanceKpis(user.id);
  const campaigns = await getUserCampaigns(user.id);

  return (
    <div className="max-w-6xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hello{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p className="mt-1 text-slate-600">
            Plan: <span className="capitalize font-medium">{profile?.subscription_tier ?? 'free'}</span>
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-5 py-2.5 text-sm font-semibold text-white"
        >
          + New campaign
        </Link>
      </header>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        Last 30 days
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Spend" value={formatMoney(kpis.spend)} />
        <StatCard label="Conversions" value={String(kpis.conversions)} />
        <StatCard
          label="ROAS"
          value={kpis.roas != null ? `${kpis.roas.toFixed(2)}x` : '—'}
          highlight
        />
        <StatCard label="CPA" value={kpis.cpa != null ? formatMoney(kpis.cpa) : '—'} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Campaigns" value={stats.totalCampaigns} />
        <StatCard label="Active" value={stats.activeCampaigns} />
        <StatCard label="Ad accounts" value={stats.connectedAccounts} />
        <StatCard label="Unread alerts" value={stats.unreadNotifications} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent campaigns</h2>
          <div className="flex gap-4 text-sm">
            <Link href="/dashboard/performance" className="font-medium text-[#0072ff] hover:underline">
              Performance
            </Link>
            <Link href="/dashboard/campaigns" className="font-medium text-[#0072ff] hover:underline">
              View all
            </Link>
          </div>
        </div>
        {campaigns.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-slate-100">
            {campaigns.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <Link
                    href={`/dashboard/campaigns/${c.id}`}
                    className="font-medium text-slate-900 hover:text-[#0072ff]"
                  >
                    {c.campaign_name}
                  </Link>
                  <p className="text-xs text-slate-500 capitalize">{c.platform} · {c.status}</p>
                </div>
                <Link
                  href={`/dashboard/campaigns/${c.id}/performance`}
                  className="text-sm text-[#0072ff] hover:underline"
                >
                  Metrics
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 text-3xl font-bold ${highlight ? 'text-[#0072ff]' : 'text-slate-900'}`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-slate-600">No campaigns yet.</p>
      <p className="mt-1 text-sm text-slate-500">
        Create a campaign or connect an ad account to sync existing ones.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Link
          href="/dashboard/campaigns/new"
          className="rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-4 py-2 text-sm font-semibold text-white"
        >
          Create campaign
        </Link>
        <Link
          href="/dashboard/accounts"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Connect account
        </Link>
      </div>
    </div>
  );
}
