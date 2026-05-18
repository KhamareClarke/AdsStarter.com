'use client';

import { useState } from 'react';

export function GhlSettings({
  initial,
  hasGhlContact,
}: {
  initial: {
    phone?: string;
    roas_threshold: number;
    conversion_drop_pct: number;
    budget_warning_pct: number;
    auto_pause_on_budget: boolean;
    daily_report_time: string;
    sms_enabled: boolean;
    email_enabled: boolean;
  };
  hasGhlContact: boolean;
}) {
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [roasThreshold, setRoasThreshold] = useState(initial.roas_threshold);
  const [autoPause, setAutoPause] = useState(initial.auto_pause_on_budget);
  const [reportTime, setReportTime] = useState(initial.daily_report_time?.slice(0, 5) ?? '09:00');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function syncContact() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/ghl/contacts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sync failed');
      setMessage('GHL contact synced');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/ghl/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          roas_threshold: roasThreshold,
          auto_pause_on_budget: autoPause,
          daily_report_time: reportTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setMessage('Settings saved');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        GHL status:{' '}
        <span className={hasGhlContact ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
          {hasGhlContact ? 'Connected' : 'Not synced — add phone and sync'}
        </span>
      </p>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Phone (SMS alerts)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">ROAS alert threshold</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={roasThreshold}
          onChange={(e) => setRoasThreshold(parseFloat(e.target.value))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Daily report time (UTC)</label>
        <input
          type="time"
          value={reportTime}
          onChange={(e) => setReportTime(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={autoPause}
          onChange={(e) => setAutoPause(e.target.checked)}
          className="rounded"
        />
        Auto-pause campaign when daily budget is hit
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={syncContact}
          disabled={loading}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          Sync to GHL
        </button>
        <button
          type="button"
          onClick={saveSettings}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Save alert settings
        </button>
      </div>

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
