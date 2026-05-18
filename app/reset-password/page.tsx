import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = { title: 'Set new password | AdsStarter' };

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Set new password</h1>
        <p className="mt-1 text-sm text-slate-600">Choose a password at least 8 characters long.</p>
        <div className="mt-8">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
