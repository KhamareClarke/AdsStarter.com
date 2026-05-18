import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/db/queries';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';

export const metadata = { title: 'Dashboard | AdsStarter' };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(user.id);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardNav email={profile?.email ?? user.email ?? ''} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
