'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/campaigns', label: 'Campaigns' },
  { href: '/dashboard/performance', label: 'Performance' },
  { href: '/dashboard/accounts', label: 'Ad accounts' },
  { href: '/dashboard/empire-os', label: 'Empire OS' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/roi-calculator', label: 'ROI Calculator' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export function DashboardNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-6">
        <Link href="/dashboard" className="text-lg font-bold bg-gradient-to-r from-[#00c6ff] to-[#0072ff] bg-clip-text text-transparent">
          AdsStarter
        </Link>
        <p className="mt-1 truncate text-xs text-slate-500">{email}</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const active =
            link.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-gradient-to-r from-[#00c6ff]/10 to-[#0072ff]/10 text-[#0072ff]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4 space-y-2">
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Back to website
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
