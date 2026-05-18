'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Campaign } from '@/lib/db/types';

export function CampaignEditor({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [name, setName] = useState(campaign.campaign_name);
  const [budget, setBudget] = useState(String(campaign.budget_daily ?? ''));
  const [status, setStatus] = useState(campaign.status);
  const [startDate, setStartDate] = useState(campaign.start_date ?? '');
  const [endDate, setEndDate] = useState(campaign.end_date ?? '');
  const [objective, setObjective] = useState(campaign.objective ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function save() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_name: name,
          budget_daily: budget ? parseFloat(budget) : null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          objective,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function pauseResume(action: 'pause' | 'resume') {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed');
      }
      setStatus(action === 'pause' ? 'paused' : 'active');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/campaigns/${campaign.id}/performance`}
          className="text-sm font-medium text-[#0072ff] hover:underline"
        >
          View performance →
        </Link>
        <Link
          href={`/dashboard/reports/${campaign.id}`}
          className="text-sm font-medium text-[#0072ff] hover:underline"
        >
          Client report →
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <Field label="Campaign name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Daily budget ($)">
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as Campaign['status'])} className={inputCls}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="End">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Objective">
          <input value={objective} onChange={(e) => setObjective(e.target.value)} className={inputCls} />
        </Field>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={loading}
            className="rounded-lg bg-[#0072ff] px-5 py-2 text-sm font-medium text-white"
          >
            Save changes
          </button>
          {status === 'active' ? (
            <button type="button" onClick={() => pauseResume('pause')} className="rounded-lg border px-4 py-2 text-sm">
              Pause campaign
            </button>
          ) : (
            <button type="button" onClick={() => pauseResume('resume')} className="rounded-lg border px-4 py-2 text-sm">
              Resume campaign
            </button>
          )}
        </div>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  );
}

const inputCls = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      {children}
    </label>
  );
}
