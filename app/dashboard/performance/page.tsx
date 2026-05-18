import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserCampaigns } from '@/lib/db/queries';
import { getPerformanceKpis } from '@/lib/db/campaign-queries';
import { formatMoney } from '@/lib/reports/format';

export const metadata = { title: 'Performance | AdsStarter' };

export default async function PerformanceOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const kpis = await getPerformanceKpis(user.id);
  const campaigns = await getUserCampaigns(user.id);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">Performance overview</h1>
      <p className="mt-1 text-slate-600">Last 30 days across all campaigns</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total spend" value={formatMoney(kpis.spend)} />
        <KpiCard label="Conversions" value={String(kpis.conversions)} />
        <KpiCard
          label="ROAS"
          value={kpis.roas != null ? `${kpis.roas.toFixed(2)}x` : '—'}
          highlight
        />
        <KpiCard label="CPA" value={kpis.cpa != null ? formatMoney(kpis.cpa) : '—'} />
        <KpiCard label="Impressions" value={kpis.impressions.toLocaleString()} />
        <KpiCard label="CTR" value={`${kpis.ctr.toFixed(2)}%`} />
        <KpiCard label="Est. revenue" value={formatMoney(kpis.revenue)} />
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No campaigns yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="p-2">Name</th>
                <th className="p-2">Platform</th>
                <th className="p-2">Status</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-slate-50">
                  <td className="p-2 font-medium">{c.campaign_name}</td>
                  <td className="p-2 capitalize">{c.platform}</td>
                  <td className="p-2 capitalize">{c.status}</td>
                  <td className="p-2">
                    <Link
                      href={`/dashboard/campaigns/${c.id}/performance`}
                      className="text-[#0072ff] hover:underline"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-[#0072ff]' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}
