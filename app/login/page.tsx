import { Suspense } from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata = { title: 'Sign in | AdsStarter' };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-slate-500 hover:text-[#0072ff] mb-6 inline-block">
          ← Back to home
        </Link>
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to manage your ad campaigns</p>
          <div className="mt-8">
            <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
              <AuthForm mode="login" />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
