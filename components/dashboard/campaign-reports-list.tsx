'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface ReportCampaign {
  id: string;
  campaign_name: string;
  platform: string;
  status: string;
}

export function CampaignReportsList({ campaigns }: { campaigns: ReportCampaign[] }) {
  const [aov, setAov] = useState('35');

  if (campaigns.length === 0) {
    return (
      <p className="p-8 text-center text-slate-500">
        No campaigns yet. Connect an ad account and sync campaigns to generate reports.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <label className="text-sm text-slate-600">
          Revenue per conversion (for report estimates)
          <input
            type="number"
            min="0"
            step="0.01"
            value={aov}
            onChange={(e) => setAov(e.target.value)}
            className="mt-1 block w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-slate-500">
            <th className="p-4 font-medium">Campaign</th>
            <th className="p-4 font-medium">Platform</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className="border-b border-slate-50">
              <td className="p-4 font-medium text-slate-900">{c.campaign_name}</td>
              <td className="p-4 capitalize text-slate-600">{c.platform}</td>
              <td className="p-4 capitalize text-slate-600">{c.status}</td>
              <td className="p-4 space-x-3">
                <Link
                  href={`/dashboard/reports/${c.id}?aov=${encodeURIComponent(aov)}`}
                  className="font-medium text-[#0072ff] hover:underline"
                >
                  Preview
                </Link>
                <a
                  href={`/api/reports/campaign/${c.id}?aov=${encodeURIComponent(aov)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#0072ff] hover:underline"
                >
                  HTML
                </a>
                <a
                  href={`/api/reports/campaign/${c.id}?format=pdf&aov=${encodeURIComponent(aov)}`}
                  className="font-medium text-[#0072ff] hover:underline"
                >
                  PDF
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
