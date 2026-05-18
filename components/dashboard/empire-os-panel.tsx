'use client';

import { useState } from 'react';

export interface EmpireRec {
  id: string;
  skill_name: string;
  rec_type: string;
  title: string;
  action: string;
  reason: string;
  expected_impact: string;
  confidence: number;
  created_at: string;
  campaigns?: { campaign_name: string; platform: string };
}

export interface EmpireLog {
  id: string;
  action: string;
  result: string | null;
  created_at: string;
  campaigns?: { campaign_name: string };
}

export function EmpireOsPanel({
  initialPending,
  initialApplied,
  stats,
}: {
  initialPending: EmpireRec[];
  initialApplied: EmpireLog[];
  stats: { total: number; accepted: number; declined: number; acceptanceRate: number };
}) {
  const [pending, setPending] = useState(initialPending);
  const [applied, setApplied] = useState(initialApplied);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(id: string, action: 'accept' | 'decline') {
    setLoading(id);
    try {
      const res = await fetch(`/api/empire-os/recommendations/${id}/${action}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');

      setPending((p) => p.filter((r) => r.id !== id));
      if (action === 'accept') {
        window.location.reload();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(null);
    }
  }

  async function runAnalysis() {
    setLoading('analyze');
    try {
      const res = await fetch('/api/empire-os/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      alert(`Analyzed ${data.analyzed ?? 1} campaign(s). Refresh to see recommendations.`);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total recommendations" value={stats.total} />
        <StatCard label="Accepted / applied" value={stats.accepted} />
        <StatCard label="Declined" value={stats.declined} />
        <StatCard label="Acceptance rate" value={`${stats.acceptanceRate}%`} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Pending recommendations</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading === 'analyze'}
              onClick={runAnalysis}
              className="rounded-lg border border-[#0072ff] px-3 py-1.5 text-xs font-medium text-[#0072ff] hover:bg-blue-50 disabled:opacity-60"
            >
              {loading === 'analyze' ? 'Analyzing…' : 'Run analysis now'}
            </button>
            <span className="text-xs text-slate-500">Auto: every 4h</span>
          </div>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">
            No pending recommendations. Sync campaigns and metrics, then wait for the next Empire OS
            analysis cycle.
          </p>
        ) : (
          <ul className="space-y-4">
            {pending.map((rec) => (
              <li
                key={rec.id}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-[#0072ff]">
                      {rec.campaigns?.campaign_name ?? 'Campaign'} · {rec.skill_name}
                    </p>
                    <h3 className="font-semibold text-slate-900 mt-1">{rec.title}</h3>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600 border">
                    {rec.confidence}% confidence
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  <strong>Action:</strong> {rec.action}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  <strong>Why:</strong> {rec.reason}
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  <strong>Expected impact:</strong> {rec.expected_impact}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={loading === rec.id}
                    onClick={() => handleAction(rec.id, 'accept')}
                    className="rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {loading === rec.id ? '…' : 'Accept'}
                  </button>
                  <button
                    type="button"
                    disabled={loading === rec.id}
                    onClick={() => handleAction(rec.id, 'decline')}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Applied optimizations</h2>
        {applied.length === 0 ? (
          <p className="text-sm text-slate-500">No applied changes yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Campaign</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {applied.map((log) => (
                <tr key={log.id} className="border-b border-slate-50">
                  <td className="py-2 text-slate-600">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2">{log.campaigns?.campaign_name ?? '—'}</td>
                  <td className="py-2">{log.action}</td>
                  <td className="py-2 text-emerald-700">{log.result ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-dashed border-slate-200 p-4">
        <h3 className="font-medium text-slate-900">Active Empire OS skills</h3>
        <p className="mt-2 text-sm text-slate-600">
          paid-ads, ad-creative, ab-test-setup, pricing-strategy, launch-strategy, copywriting,
          marketing-ideas, page-cro, form-cro, popup-cro, onboarding-cro, free-tool-strategy
        </p>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
