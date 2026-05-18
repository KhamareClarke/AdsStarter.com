import { createClient } from '@/lib/supabase/server';
import { getUserCampaigns } from '@/lib/db/queries';
import { CampaignReportsList } from '@/components/dashboard/campaign-reports-list';

export const metadata = { title: 'Campaign Reports | AdsStarter' };

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const campaigns = await getUserCampaigns(user.id);

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Campaign Reports</h1>
        <p className="mt-1 text-slate-600">
          Professional HTML reports with metrics, insights, and Empire OS recommendations.
          Print or save as PDF from the report page.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CampaignReportsList
          campaigns={campaigns.map((c) => ({
            id: c.id,
            campaign_name: c.campaign_name,
            platform: c.platform,
            status: c.status,
          }))}
        />
      </div>
    </div>
  );
}
