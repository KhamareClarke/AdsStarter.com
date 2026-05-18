import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCampaignById } from '@/lib/db/campaign-queries';
import { CampaignEditor } from '@/components/dashboard/campaign-editor';

export const metadata = { title: 'Edit campaign | AdsStarter' };

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const campaign = await getCampaignById(user.id, params.id);
  if (!campaign) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/campaigns" className="text-sm text-[#0072ff] hover:underline">
        ← Campaigns
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{campaign.campaign_name}</h1>
      <p className="mt-1 capitalize text-slate-600">
        {campaign.platform} · {campaign.status}
      </p>
      <div className="mt-8">
        <CampaignEditor campaign={campaign} />
      </div>
    </div>
  );
}
