'use client';

import { useState } from 'react';

const defaults = {
  allow_auto_optimize: false,
  allow_adjust_bids: false,
  allow_adjust_budgets: false,
  allow_pause_ads: false,
  allow_create_variations: false,
  max_bid_increase_pct: 20,
  max_budget_increase_pct: 50,
  auto_pause_cpa_threshold: 15,
  industry: 'general',
};

export function EmpireOsSettingsForm({
  initial,
}: {
  initial: Partial<typeof defaults> | null;
}) {
  const [settings, setSettings] = useState({ ...defaults, ...initial });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/empire-os/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setMessage('Empire OS settings saved');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  function toggle(key: keyof typeof defaults) {
    if (typeof settings[key] === 'boolean') {
      setSettings((s) => ({ ...s, [key]: !s[key] }));
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.allow_auto_optimize}
          onChange={() => toggle('allow_auto_optimize')}
        />
        Allow Empire OS to auto-apply recommendations
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.allow_adjust_bids}
          onChange={() => toggle('allow_adjust_bids')}
        />
        Allow bid adjustments
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.allow_adjust_budgets}
          onChange={() => toggle('allow_adjust_budgets')}
        />
        Allow budget adjustments
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.allow_pause_ads}
          onChange={() => toggle('allow_pause_ads')}
        />
        Allow pausing ads / campaigns
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.allow_create_variations}
          onChange={() => toggle('allow_create_variations')}
        />
        Allow creating ad variations
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-slate-600 mb-1">Max bid increase %</label>
          <input
            type="number"
            value={settings.max_bid_increase_pct}
            onChange={(e) =>
              setSettings((s) => ({ ...s, max_bid_increase_pct: Number(e.target.value) }))
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-slate-600 mb-1">Max budget increase %</label>
          <input
            type="number"
            value={settings.max_budget_increase_pct}
            onChange={(e) =>
              setSettings((s) => ({ ...s, max_budget_increase_pct: Number(e.target.value) }))
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={loading}
        className="rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        Save Empire OS settings
      </button>
      {message && <p className="text-slate-600">{message}</p>}
    </div>
  );
}
