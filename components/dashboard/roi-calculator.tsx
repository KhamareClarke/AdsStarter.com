'use client';

import { useMemo, useState } from 'react';
import {
  calcCpa,
  calcPaybackDays,
  calcProfit,
  calcProfitPerAcquisition,
  calcRoi,
  calcRoas,
} from '@/lib/reports/metrics';
import { formatMoney } from '@/lib/reports/format';

export interface RoiCampaignOption {
  id: string;
  name: string;
  spend: number;
  conversions: number;
  revenue: number;
}

export function RoiCalculator({
  campaigns = [],
  defaultAov = 35,
}: {
  campaigns?: RoiCampaignOption[];
  defaultAov?: number;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [spend, setSpend] = useState('5247');
  const [conversions, setConversions] = useState('342');
  const [aov, setAov] = useState(String(defaultAov));

  function loadCampaign(id: string) {
    setSelectedId(id);
    const c = campaigns.find((x) => x.id === id);
    if (!c) return;
    setCampaignName(c.name);
    setSpend(String(c.spend));
    setConversions(String(c.conversions));
    if (c.conversions > 0) {
      setAov(String((c.revenue / c.conversions).toFixed(2)));
    }
  }

  const result = useMemo(() => {
    const totalSpend = parseFloat(spend) || 0;
    const totalConversions = parseInt(conversions, 10) || 0;
    const orderValue = parseFloat(aov) || 0;
    const revenue = totalConversions * orderValue;
    const profit = calcProfit(revenue, totalSpend);
    const roi = calcRoi(profit, totalSpend);
    const roas = calcRoas(revenue, totalSpend);
    const cpa = calcCpa(totalSpend, totalConversions);
    const ppa = calcProfitPerAcquisition(profit, totalConversions);
    const periodDays = 30;
    const dailyProfit = periodDays > 0 ? profit / periodDays : 0;
    const payback = calcPaybackDays(totalSpend, dailyProfit);

    return { revenue, profit, roi, roas, cpa, ppa, payback };
  }, [spend, conversions, aov]);

  const metrics = [
    { label: 'Total spend', value: formatMoney(parseFloat(spend) || 0) },
    { label: 'Total revenue', value: formatMoney(result.revenue) },
    { label: 'Profit', value: formatMoney(result.profit) },
    {
      label: 'ROI',
      value: result.roi != null ? `${result.roi.toFixed(0)}%` : '—',
      hint: 'profit ÷ spend',
    },
    {
      label: 'ROAS',
      value: result.roas != null ? `${result.roas.toFixed(2)}x` : '—',
      hint: 'revenue ÷ spend',
    },
    {
      label: 'Payback period',
      value: result.payback != null ? `${result.payback} days` : '—',
      hint: 'based on 30-day profit pace',
    },
    {
      label: 'Cost per acquisition',
      value: result.cpa != null ? formatMoney(result.cpa) : '—',
    },
    {
      label: 'Profit per acquisition',
      value: result.ppa != null ? formatMoney(result.ppa) : '—',
    },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <h2 className="text-lg font-semibold text-slate-900">Inputs</h2>

        {campaigns.length > 0 ? (
          <label className="block text-sm text-slate-600">
            Load from campaign
            <select
              value={selectedId}
              onChange={(e) => loadCampaign(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Manual entry</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block text-sm text-slate-600">
          Campaign name (optional)
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Summer Sale"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-slate-600">
          Total spend ($)
          <input
            type="number"
            min="0"
            step="0.01"
            value={spend}
            onChange={(e) => setSpend(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-slate-600">
          Total conversions
          <input
            type="number"
            min="0"
            step="1"
            value={conversions}
            onChange={(e) => setConversions(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-slate-600">
          Average order value ($)
          <input
            type="number"
            min="0"
            step="0.01"
            value={aov}
            onChange={(e) => setAov(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        {campaignName ? (
          <p className="text-xs text-slate-500">Scenario: {campaignName}</p>
        ) : null}
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Results</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use these figures to justify ad spend to leadership or clients.
        </p>
        <dl className="mt-6 space-y-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex items-baseline justify-between border-b border-slate-50 pb-3"
            >
              <dt className="text-sm text-slate-600">
                {m.label}
                {m.hint ? (
                  <span className="block text-xs text-slate-400">{m.hint}</span>
                ) : null}
              </dt>
              <dd className="text-lg font-bold text-slate-900">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
