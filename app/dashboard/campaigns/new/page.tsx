import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CampaignWizard } from '@/components/dashboard/campaign-wizard';

export const metadata = { title: 'New campaign | AdsStarter' };

export default async function NewCampaignPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: accounts } = await supabase
    .from('ad_accounts')
    .select('id, platform, account_name')
    .eq('user_id', user.id)
    .eq('is_active', true);

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/campaigns" className="text-sm text-[#0072ff] hover:underline">
        ← Campaigns
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Create campaign</h1>
      <p className="mt-1 text-slate-600">5-step wizard to launch a new ad campaign.</p>
      <div className="mt-8">
        <CampaignWizard adAccounts={accounts ?? []} />
      </div>
    </div>
  );
}
