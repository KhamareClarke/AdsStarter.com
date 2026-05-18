import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCampaignById, getCampaignMetrics } from '@/lib/db/campaign-queries';
import { getUserReportSettings } from '@/lib/reports/settings';
import { CampaignPerformanceView } from '@/components/dashboard/campaign-performance';

export const metadata = { title: 'Campaign performance | AdsStarter' };

export default async function CampaignPerformancePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const campaign = await getCampaignById(user.id, params.id);
  if (!campaign) notFound();

  const metrics = await getCampaignMetrics(params.id);
  const settings = await getUserReportSettings(user.id);

  return (
    <div className="max-w-5xl">
      <Link href={`/dashboard/campaigns/${params.id}`} className="text-sm text-[#0072ff] hover:underline">
        ← Edit campaign
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Performance</h1>
      <p className="mt-1 text-slate-600">{campaign.campaign_name}</p>
      <div className="mt-8">
        <CampaignPerformanceView
          campaignName={campaign.campaign_name}
          metrics={metrics}
          defaultAov={settings.default_aov}
        />
      </div>
    </div>
  );
}
