'use client';

import { Suspense, useState, SubmitEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import BrandLogo from '@/components/BrandLogo';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FAF6F3] text-[#A8A19A]">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F3] text-[#2D2A26] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-[#F0EAE3] via-[#FAF6F3] to-[#EBE4DC] opacity-50 pointer-events-none" />

      <div className="w-full max-w-[480px] p-10 md:p-12 rounded-3xl bg-white border border-[#EBE6E0] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative z-10 mx-4">
        <div className="text-center mb-10">
          <BrandLogo className="mb-8" />
          <h1 className="font-heading text-3xl text-[#2D2A26] mb-3">Set a new password</h1>
          <p className="text-[#827A73] text-[15px]">Choose a new password for {email || 'your account'}.</p>
        </div>

        {!token || !email ? (
          <div className="p-4 rounded-xl bg-[#F8F3F2] border border-[#EFE3E1] text-[#9A5C4F] text-sm text-center">
            This reset link is missing or invalid. Please request a new one from the{' '}
            <a href="/forgot-password" className="underline">forgot password</a> page.
          </div>
        ) : done ? (
          <div className="p-4 rounded-xl bg-[#F3F6F3] border border-[#E1EFE3] text-[#4F7A5C] text-sm text-center">
            Password reset. Redirecting you to sign in...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-[#F8F3F2] border border-[#EFE3E1] text-[#9A5C4F] text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="flex items-center gap-2 text-[15px] text-[#524A44] mb-2">
                <Lock size={16} className="text-[#A8A19A]" /> New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-white border border-[#EBE6E0] text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073] transition-all placeholder:text-[#A8A19A]"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A19A] hover:text-[#9A8073] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="password_confirmation" className="flex items-center gap-2 text-[15px] text-[#524A44] mb-2">
                <Lock size={16} className="text-[#A8A19A]" /> Confirm New Password
              </label>
              <input
                id="password_confirmation"
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full pl-4 pr-4 py-3.5 rounded-xl bg-white border border-[#EBE6E0] text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073] transition-all placeholder:text-[#A8A19A]"
                placeholder="Re-enter new password"
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-xl bg-[#9A8073] hover:bg-[#91756A] text-white text-[15px] font-medium transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <a href="/login" className="text-[15px] text-[#827A73] hover:text-[#9A8073] transition-colors">
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
