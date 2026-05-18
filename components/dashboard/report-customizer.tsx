'use client';

import { useState } from 'react';
import {
  REPORT_SECTION_KEYS,
  REPORT_SECTION_LABELS,
  type ReportSectionsConfig,
} from '@/lib/reports/sections';
import type { ReportSettings } from '@/lib/reports/settings';

export function ReportCustomizer({
  campaignId,
  initial,
}: {
  campaignId: string;
  initial: ReportSettings;
}) {
  const [sections, setSections] = useState<ReportSectionsConfig>(initial.sections);
  const [agencyName, setAgencyName] = useState(initial.agency_name ?? '');
  const [clientName, setClientName] = useState(initial.client_name ?? '');
  const [footerNote, setFooterNote] = useState(initial.footer_note ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleSection(key: (typeof REPORT_SECTION_KEYS)[number]) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/reports/campaign/${campaignId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections,
          agency_name: agencyName || null,
          client_name: clientName || null,
          footer_note: footerNote || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setSaved(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save report settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Customize report</h2>
      <p className="mt-1 text-sm text-slate-600">
        Choose sections and branding for HTML and PDF exports.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          Agency name
          <input
            value={agencyName}
            onChange={(e) => {
              setAgencyName(e.target.value);
              setSaved(false);
            }}
            placeholder="Your agency"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-600">
          Client name
          <input
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              setSaved(false);
            }}
            placeholder="Client Co."
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm text-slate-600">
        Footer note
        <textarea
          value={footerNote}
          onChange={(e) => {
            setFooterNote(e.target.value);
            setSaved(false);
          }}
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          placeholder="Confidential — for internal use only"
        />
      </label>

      <p className="mt-6 text-sm font-medium text-slate-700">Report sections</p>
      <ul className="mt-2 space-y-2">
        {REPORT_SECTION_KEYS.map((key) => (
          <li key={key}>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={sections[key]}
                onChange={() => toggleSection(key)}
                className="rounded border-slate-300"
              />
              {REPORT_SECTION_LABELS[key]}
            </label>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-6 rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save customization'}
      </button>
    </section>
  );
}
