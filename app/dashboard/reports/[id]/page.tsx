import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchCampaignReportData } from '@/lib/reports/campaign-report-generator';
import { createReportShareToken } from '@/lib/reports/share-token';
import { getCampaignReportSettings } from '@/lib/reports/settings';
import { ReportSharePanel } from '@/components/dashboard/report-share-panel';
import { ReportCustomizer } from '@/components/dashboard/report-customizer';
import { formatMoney } from '@/lib/reports/format';

export const metadata = { title: 'Report Preview | AdsStarter' };

export default async function ReportPreviewPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { aov?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const reportSettings = await getCampaignReportSettings(user.id, params.id);
  const aov = searchParams.aov ?? String(reportSettings.default_aov);
  const revenuePerConversion = parseFloat(aov);

  const data = await fetchCampaignReportData(params.id, user.id, {
    revenuePerConversion: Number.isNaN(revenuePerConversion)
      ? reportSettings.default_aov
      : revenuePerConversion,
  });

  const shareToken = createReportShareToken(params.id, user.id);
  const s = data.summary;
  const query = `aov=${encodeURIComponent(aov)}`;

  return (
    <div className="max-w-5xl space-y-8">
      <header>
        <Link href="/dashboard/reports" className="text-sm text-[#0072ff] hover:underline">
          ← All reports
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{data.campaign.name}</h1>
        <p className="mt-1 text-slate-600">
          {data.period.start} — {data.period.end} · {data.campaign.platform}
        </p>
      </header>

      {s.impressions === 0 && s.spend === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No metrics synced yet. Connect an ad account under{' '}
          <Link href="/dashboard/accounts" className="font-medium underline">
            Ad accounts
          </Link>{' '}
          and run sync to fill this report.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Spend</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(s.spend)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Conversions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{s.conversions}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">ROAS</p>
          <p className="mt-1 text-2xl font-bold text-[#0072ff]">
            {s.roas != null ? `${s.roas.toFixed(2)}x` : '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/reports/campaign/${params.id}?${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-5 py-2.5 text-sm font-medium text-white"
        >
          Open HTML report
        </a>
        <a
          href={`/api/reports/campaign/${params.id}?format=pdf&${query}`}
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Download PDF
        </a>
      </div>

      <ReportCustomizer campaignId={params.id} initial={reportSettings} />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Insights preview</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {data.insights.worked_well.slice(0, 3).map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </section>

      <ReportSharePanel campaignId={params.id} shareToken={shareToken} aov={aov} />
    </div>
  );
}
