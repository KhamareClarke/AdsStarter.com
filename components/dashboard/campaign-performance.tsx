'use client';

import type { CampaignMetric } from '@/lib/db/types';
import { formatMoney } from '@/lib/reports/format';
import { calcCpa, calcCtr, calcRoas } from '@/lib/reports/metrics';

export function CampaignPerformanceView({
  campaignName,
  metrics,
  defaultAov = 35,
}: {
  campaignName: string;
  metrics: CampaignMetric[];
  defaultAov?: number;
}) {
  const totals = metrics.reduce(
    (acc, r) => ({
      impressions: acc.impressions + Number(r.impressions),
      clicks: acc.clicks + Number(r.clicks),
      spend: acc.spend + Number(r.spend),
      conversions: acc.conversions + Number(r.conversions),
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );

  const revenue = totals.conversions * defaultAov;
  const roas = calcRoas(revenue, totals.spend);
  const cpa = calcCpa(totals.spend, totals.conversions);
  const ctr = calcCtr(totals.clicks, totals.impressions);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Spend" value={formatMoney(totals.spend)} />
        <Kpi label="Conversions" value={String(totals.conversions)} />
        <Kpi label="ROAS" value={roas != null ? `${roas.toFixed(2)}x` : '—'} highlight />
        <Kpi label="CPA" value={cpa != null ? formatMoney(cpa) : '—'} />
        <Kpi label="Impressions" value={totals.impressions.toLocaleString()} />
        <Kpi label="Clicks" value={totals.clicks.toLocaleString()} />
        <Kpi label="CTR" value={`${ctr.toFixed(2)}%`} />
        <Kpi label="Est. revenue" value={formatMoney(revenue)} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Daily performance — {campaignName}</h2>
        {metrics.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No metrics yet. Connect your ad account and run sync from Ad accounts.
          </p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="p-2">Date</th>
                <th className="p-2">Spend</th>
                <th className="p-2">Clicks</th>
                <th className="p-2">Conv.</th>
                <th className="p-2">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const rev = Number(m.conversions) * defaultAov;
                const dayRoas = calcRoas(rev, Number(m.spend));
                return (
                  <tr key={m.date} className="border-b border-slate-50">
                    <td className="p-2">{m.date}</td>
                    <td className="p-2">{formatMoney(Number(m.spend))}</td>
                    <td className="p-2">{m.clicks}</td>
                    <td className="p-2">{m.conversions}</td>
                    <td className="p-2">{dayRoas != null ? `${dayRoas.toFixed(2)}x` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? 'text-[#0072ff]' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}
