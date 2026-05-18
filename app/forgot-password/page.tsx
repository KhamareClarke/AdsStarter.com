import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = { title: 'Reset password | AdsStarter' };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="text-sm text-slate-500 hover:text-[#0072ff] mb-6 inline-block">
          ← Back to sign in
        </Link>
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
          <p className="mt-1 text-sm text-slate-600">
            Enter your email and we will send you a reset link.
          </p>
          <div className="mt-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
