import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserCampaigns } from '@/lib/db/queries';

export default async function CampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const campaigns = await getUserCampaigns(user.id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="mt-1 text-slate-600">Manage all ad campaigns across platforms.</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-5 py-2.5 text-sm font-semibold text-white"
        >
          + New campaign
        </Link>
      </div>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        {campaigns.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No campaigns yet.{' '}
            <Link href="/dashboard/campaigns/new" className="text-[#0072ff] hover:underline">
              Create one
            </Link>{' '}
            or{' '}
            <Link href="/dashboard/accounts" className="text-[#0072ff] hover:underline">
              connect an ad account
            </Link>
            .
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Platform</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-slate-50">
                  <td className="p-4 font-medium text-slate-900">
                    <Link href={`/dashboard/campaigns/${c.id}`} className="hover:text-[#0072ff]">
                      {c.campaign_name}
                    </Link>
                  </td>
                  <td className="p-4 capitalize text-slate-600">{c.platform}</td>
                  <td className="p-4 capitalize text-slate-600">{c.status}</td>
                  <td className="p-4 space-x-3">
                    <Link
                      href={`/dashboard/campaigns/${c.id}/performance`}
                      className="font-medium text-[#0072ff] hover:underline"
                    >
                      Performance
                    </Link>
                    <Link
                      href={`/dashboard/reports/${c.id}`}
                      className="font-medium text-[#0072ff] hover:underline"
                    >
                      Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
