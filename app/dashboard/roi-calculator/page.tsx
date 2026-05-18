import { createClient } from '@/lib/supabase/server';
import { getUserCampaigns } from '@/lib/db/queries';
import { getUserReportSettings } from '@/lib/reports/settings';
import { getCampaignMetricsTotals } from '@/lib/reports/campaign-metrics';
import { RoiCalculator } from '@/components/dashboard/roi-calculator';

export const metadata = { title: 'ROI Calculator | AdsStarter' };

export default async function RoiCalculatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const reportSettings = await getUserReportSettings(user.id);
  const campaigns = await getUserCampaigns(user.id);

  const options = await Promise.all(
    campaigns.map(async (c) => {
      const totals = await getCampaignMetricsTotals(c.id, reportSettings.default_aov);
      return {
        id: c.id,
        name: c.campaign_name,
        spend: totals?.spend ?? 0,
        conversions: totals?.conversions ?? 0,
        revenue: totals?.revenue ?? 0,
      };
    })
  );

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">ROI Calculator</h1>
        <p className="mt-1 text-slate-600">
          Calculate return on ad spend, payback period, and profit per acquisition. Load synced
          campaign metrics or enter values manually.
        </p>
      </header>
      <RoiCalculator campaigns={options} defaultAov={reportSettings.default_aov} />
    </div>
  );
}
