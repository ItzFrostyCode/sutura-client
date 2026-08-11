'use client';

import { useState, SubmitEvent } from 'react';
import api from '@/lib/axios';
import BrandLogo from '@/components/BrandLogo';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
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
          <h1 className="font-heading text-3xl text-[#2D2A26] mb-3">Reset your password</h1>
          <p className="text-[#827A73] text-[15px]">
            Enter the email on your account and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {sent ? (
          <div className="p-4 rounded-xl bg-[#F3F6F3] border border-[#E1EFE3] text-[#4F7A5C] text-sm text-center">
            If that email is registered, a reset link is on its way. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-[#F8F3F2] border border-[#EFE3E1] text-[#9A5C4F] text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-[15px] text-[#524A44] mb-2">
                <Mail size={16} className="text-[#A8A19A]" /> Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-4 py-3.5 rounded-xl bg-white border border-[#EBE6E0] text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073] transition-all placeholder:text-[#A8A19A]"
                placeholder="Email address here"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-xl bg-[#9A8073] hover:bg-[#91756A] text-white text-[15px] font-medium transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <a href="/login" className="inline-flex items-center gap-2 text-[15px] text-[#827A73] hover:text-[#9A8073] transition-colors">
            <ArrowLeft size={16} /> Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
