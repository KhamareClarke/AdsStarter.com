import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getGhlNotificationStats } from '@/lib/ghl/stats';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'GHL Notifications | Admin' };

export default async function GhlNotificationsAdminPage() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect('/dashboard');
  }

  const stats = await getGhlNotificationStats(24);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">GHL Notification Dashboard</h1>
        <p className="mt-1 text-slate-600">SMS, email, and workflow health (last 24h)</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">SMS metrics</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Sent" value={stats.sms.sent} />
              <Stat label="Delivered" value={`${stats.sms.delivered} (${stats.sms.deliveryRate}%)`} />
              <Stat label="Failed" value={stats.sms.failed} />
              <Stat label="Bounced" value={stats.sms.bounced} />
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Email metrics</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Sent" value={stats.email.sent} />
              <Stat label="Delivered" value={`${stats.email.delivered} (${stats.email.deliveryRate}%)`} />
              <Stat label="Opened (est.)" value={stats.email.opened} />
              <Stat label="Clicked (est.)" value={stats.email.clicked} />
            </dl>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Workflow status</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="pb-2 font-medium">Workflow</th>
                <th className="pb-2 font-medium">Active</th>
                <th className="pb-2 font-medium">Success rate</th>
              </tr>
            </thead>
            <tbody>
              {stats.workflows.map((w) => (
                <tr key={w.type} className="border-b border-slate-50">
                  <td className="py-2 capitalize">{w.type.replace(/_/g, ' ')}</td>
                  <td className="py-2">{w.active}</td>
                  <td className="py-2">{w.successRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
          <h2 className="font-semibold text-slate-900">Recent notifications</h2>
          <table className="mt-4 w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 pr-4 font-medium">Campaign</th>
                <th className="pb-2 pr-4 font-medium">Alert</th>
                <th className="pb-2 pr-4 font-medium">Channel</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No notifications in the last 24 hours
                  </td>
                </tr>
              ) : (
                stats.recent.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 pr-4">{r.time}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{r.campaignId?.slice(0, 8) ?? '—'}…</td>
                    <td className="py-2 pr-4">{r.alertType}</td>
                    <td className="py-2 pr-4">{r.channel}</td>
                    <td className="py-2 capitalize">{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
