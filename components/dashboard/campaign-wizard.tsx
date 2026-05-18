'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook / Instagram' },
  { id: 'google', label: 'Google Ads' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
] as const;

const OBJECTIVES = [
  { id: 'OUTCOME_TRAFFIC', label: 'Traffic' },
  { id: 'OUTCOME_SALES', label: 'Conversions / Sales' },
  { id: 'OUTCOME_AWARENESS', label: 'Brand awareness' },
  { id: 'OUTCOME_LEADS', label: 'Leads' },
];

export function CampaignWizard({ adAccounts }: { adAccounts: { id: string; platform: string; account_name: string }[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [platform, setPlatform] = useState('facebook');
  const [accountId, setAccountId] = useState('');
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('OUTCOME_TRAFFIC');
  const [budgetDaily, setBudgetDaily] = useState('50');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locations, setLocations] = useState('United States');
  const [ageMin, setAgeMin] = useState('25');
  const [ageMax, setAgeMax] = useState('54');
  const [adCopy, setAdCopy] = useState('');
  const [pushToPlatform, setPushToPlatform] = useState(false);
  const [launchStatus, setLaunchStatus] = useState<'draft' | 'active'>('draft');

  const platformAccounts = adAccounts.filter((a) => a.platform === platform);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_name: name,
          platform,
          ad_account_id: accountId || platformAccounts[0]?.id,
          objective,
          budget_daily: parseFloat(budgetDaily) || 0,
          start_date: startDate || null,
          end_date: endDate || null,
          status: launchStatus,
          targeting: {
            locations: locations.split(',').map((s) => s.trim()),
            age_min: parseInt(ageMin, 10),
            age_max: parseInt(ageMax, 10),
          },
          ad_copy: adCopy,
          pushToPlatform: pushToPlatform && platform === 'facebook',
          accountId: accountId || platformAccounts[0]?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create campaign');
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`h-2 flex-1 rounded-full ${step >= n ? 'bg-[#0072ff]' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {step === 1 && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Select platform</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`rounded-lg border px-4 py-3 text-left text-sm ${
                  platform === p.id
                    ? 'border-[#0072ff] bg-[#0072ff]/5 text-[#0072ff]'
                    : 'border-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-lg bg-[#0072ff] px-5 py-2.5 text-sm font-medium text-white"
          >
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Campaign details</h2>
          <Field label="Campaign name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Objective">
            <select value={objective} onChange={(e) => setObjective(e.target.value)} className={inputCls}>
              {OBJECTIVES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Daily budget ($)">
            <input type="number" min="1" value={budgetDaily} onChange={(e) => setBudgetDaily(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="End date">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </Field>
          </div>
          {platformAccounts.length > 0 && (
            <Field label="Ad account">
              <select value={accountId || platformAccounts[0]?.id} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
                {platformAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="rounded-lg border px-4 py-2 text-sm">
              Back
            </button>
            <button type="button" onClick={() => setStep(3)} className="rounded-lg bg-[#0072ff] px-5 py-2.5 text-sm text-white">
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Targeting</h2>
          <Field label="Locations (comma-separated)">
            <input value={locations} onChange={(e) => setLocations(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age min">
              <input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Age max">
              <input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="rounded-lg border px-4 py-2 text-sm">
              Back
            </button>
            <button type="button" onClick={() => setStep(4)} className="rounded-lg bg-[#0072ff] px-5 py-2.5 text-sm text-white">
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Creative</h2>
          <Field label="Ad copy">
            <textarea value={adCopy} onChange={(e) => setAdCopy(e.target.value)} rows={4} className={inputCls} placeholder="Headline and primary text for your ad…" />
          </Field>
          <p className="text-xs text-slate-500">Upload images/videos in the ad platform after launch, or sync existing ads.</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(3)} className="rounded-lg border px-4 py-2 text-sm">
              Back
            </button>
            <button type="button" onClick={() => setStep(5)} className="rounded-lg bg-[#0072ff] px-5 py-2.5 text-sm text-white">
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Review & launch</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><strong>Platform:</strong> {platform}</li>
            <li><strong>Name:</strong> {name}</li>
            <li><strong>Budget:</strong> ${budgetDaily}/day</li>
            <li><strong>Objective:</strong> {objective}</li>
          </ul>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pushToPlatform} onChange={(e) => setPushToPlatform(e.target.checked)} />
            Push to {platform} (Facebook only when connected)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={launchStatus === 'draft'} onChange={() => setLaunchStatus('draft')} />
            Save as draft
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={launchStatus === 'active'} onChange={() => setLaunchStatus('active')} />
            Mark active
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(4)} className="rounded-lg border px-4 py-2 text-sm">
              Back
            </button>
            <button
              type="button"
              disabled={loading || !name}
              onClick={submit}
              className="rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create campaign'}
            </button>
          </div>
        </section>
      )}
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
