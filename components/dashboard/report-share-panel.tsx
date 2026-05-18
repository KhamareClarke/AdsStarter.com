'use client';

import { useState } from 'react';

export function ReportSharePanel({
  campaignId,
  shareToken,
  aov,
}: {
  campaignId: string;
  shareToken: string;
  aov: string;
}) {
  const [copied, setCopied] = useState(false);
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? '';
  const shareUrl = `${base}/api/reports/share/${campaignId}?token=${shareToken}&aov=${encodeURIComponent(aov)}`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Share with clients</h2>
      <p className="mt-1 text-sm text-slate-600">
        Send this read-only link — no AdsStarter login required.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          readOnly
          value={shareUrl}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
        />
        <button
          type="button"
          onClick={copyLink}
          className="rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-4 py-2 text-sm font-medium text-white"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Open HTML
        </a>
        <a
          href={`${shareUrl}&format=pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Open PDF
        </a>
      </div>
    </div>
  );
}
