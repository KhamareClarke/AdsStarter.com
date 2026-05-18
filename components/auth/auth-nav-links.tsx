'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type Variant = 'dark' | 'light';

const styles = {
  dark: {
    login: 'text-sm font-medium text-white/70 hover:text-white transition-colors',
    signup:
      'text-sm font-medium text-white/90 hover:text-white border border-white/25 rounded-lg px-3 py-1.5 transition-colors hover:border-white/50',
    dashboard: 'text-sm font-medium text-white/90 hover:text-white transition-colors',
    logout:
      'text-sm font-medium text-white/60 hover:text-white transition-colors',
  },
  light: {
    login: 'text-sm font-medium text-slate-600 hover:text-[#0072ff] transition-colors',
    signup:
      'text-sm font-medium text-[#0072ff] border border-[#0072ff]/30 rounded-lg px-3 py-1.5 hover:bg-[#0072ff]/5 transition-colors',
    dashboard: 'text-sm font-medium text-slate-700 hover:text-[#0072ff] transition-colors',
    logout: 'text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors',
  },
} as const;

export function AuthNavLinks({ variant = 'dark' }: { variant?: Variant }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const s = styles[variant];

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  if (!ready) {
    return <div className="flex h-8 items-center gap-3" aria-hidden />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/dashboard" className={s.dashboard}>
          Dashboard
        </Link>
        <button type="button" onClick={handleLogout} className={s.logout}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Link href="/login" className={s.login}>
        Log in
      </Link>
      <Link href="/signup" className={s.signup}>
        Sign up
      </Link>
    </div>
  );
}
