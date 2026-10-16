'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, MailCheck, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';

interface ApplicationSubmittedProps {
  readonly email: string;
  readonly storeId?: number | null;
  readonly storeName?: string;
}

export default function ApplicationSubmitted({
  email,
  storeId,
  storeName,
}: ApplicationSubmittedProps) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loginEmail, setLoginEmail] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkStatus = useCallback(async () => {
    if (!email && !storeId) return;
    setChecking(true);
    try {
      const res = await api.get('/store-applications/status', {
        params: {
          email: email || undefined,
          store_id: storeId || undefined,
        },
      });
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setStatus(data.status);
        if (data.login_email) setLoginEmail(data.login_email);
        if (data.rejection_reason) setRejectionReason(data.rejection_reason);
      }
    } catch {
      // Ignore network blips during polling
    } finally {
      setChecking(false);
      setLastChecked(new Date());
    }
  }, [email, storeId]);

  // Polling every 5 seconds while pending
  useEffect(() => {
    if (status !== 'pending') return;
    const timer = setInterval(() => {
      void checkStatus();
    }, 5000);
    return () => clearInterval(timer);
  }, [checkStatus, status]);

  if (status === 'approved') {
    return (
      <section role="status" className="py-6 animate-fade-in">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-5 border border-emerald-200">
          <CheckCircle2 size={36} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 inline-block mb-3">
          Shop Approved & Live
        </span>
        <h2 className="mobile-h1 text-ink mt-2">Congratulations! Your shop is live.</h2>
        <p className="mobile-body-md text-ink-body mt-3">
          The SUTURA Admin has verified your payment receipt and approved{' '}
          <strong className="font-semibold text-ink">{storeName || 'your shop'}</strong>.
        </p>

        <div className="mt-6 p-4 sm:p-5 bg-surface border-2 border-emerald-500/30 shadow-xs space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Your Shop Credentials</p>
          {loginEmail && (
            <div>
              <span className="text-xs text-ink-muted block">Shop Login:</span>
              <span className="font-mono font-bold text-base text-ink">{loginEmail}</span>
            </div>
          )}
          <p className="text-xs text-ink-muted">
            We sent an approval email with your <strong className="text-ink">temporary password</strong> to{' '}
            <strong className="text-ink break-all">{email}</strong>.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/login?as=store"
            className="w-full sm:w-auto px-6 py-3.5 bg-ink hover:bg-ink/90 text-white text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <span>Sign In to Your Shop</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 border border-line-strong bg-white hover:bg-canvas text-ink text-sm font-semibold transition-colors flex items-center justify-center"
          >
            Go to Homepage
          </Link>
        </div>
      </section>
    );
  }

  if (status === 'rejected') {
    return (
      <section role="status" className="py-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-5 border border-rose-200">
          <AlertCircle size={36} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 inline-block mb-3">
          Application Update
        </span>
        <h2 className="mobile-h1 text-ink mt-2">Application was not approved</h2>
        {rejectionReason && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-sm text-rose-800">
            <strong>Reason:</strong> {rejectionReason}
          </div>
        )}
        <p className="mobile-body-md text-ink-body mt-4">
          If you have questions or wish to appeal, please contact SUTURA support or email us directly.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex px-5 py-3 border border-ink text-sm font-semibold uppercase tracking-wider text-ink hover:bg-canvas"
        >
          Back to Homepage
        </Link>
      </section>
    );
  }

  // Pending Status (Default)
  return (
    <section role="status" className="py-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-200 shrink-0">
          <Clock size={24} className="animate-spin text-amber-600" style={{ animationDuration: '8s' }} />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 inline-block">
            Waiting for Admin Approval
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">Application Submitted & Pending Review</h2>
        </div>
      </div>

      <p className="mobile-body-md text-ink-body mt-4">
        Your shop registration and payment receipt for{' '}
        <strong className="font-semibold text-ink">{storeName || 'your shop'}</strong> have been received.
        An admin is currently reviewing your application in the SUTURA Console.
      </p>

      {/* Live Polling Status Box */}
      <div className="mt-5 p-4 sm:p-5 bg-surface border border-line shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-ink">Live Status: Checking automatically</span>
          </div>
          <button
            type="button"
            onClick={() => void checkStatus()}
            disabled={checking}
            className="text-xs font-semibold text-taupe hover:text-ink flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
            <span>{checking ? 'Checking…' : 'Refresh Now'}</span>
          </button>
        </div>

        <p className="text-xs text-ink-muted mt-3">
          This screen will automatically update the moment your shop is approved by the admin.
        </p>
      </div>

      {/* What if you navigate away */}
      <div className="mt-5 p-4 bg-sunken border border-line text-xs sm:text-sm text-ink-body space-y-2">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <MailCheck size={18} className="text-taupe shrink-0" />
          <span>What if you close this page or navigate away?</span>
        </div>
        <p className="text-ink-muted text-xs leading-relaxed">
          Don&apos;t worry! You don&apos;t have to stay on this screen. Once approved, SUTURA will automatically send an official email to{' '}
          <strong className="text-ink break-all">{email}</strong> containing your shop login email, temporary password, and a direct sign-in link.
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="w-full sm:w-auto px-5 py-3 border border-line-strong bg-white hover:bg-canvas text-ink text-sm font-semibold transition-colors flex items-center justify-center text-center"
        >
          Back to SUTURA Homepage
        </Link>
        <Link
          href="/login?as=store"
          className="w-full sm:w-auto px-5 py-3 bg-taupe hover:bg-ink text-white text-sm font-semibold transition-colors flex items-center justify-center text-center"
        >
          Go to Shop Login
        </Link>
      </div>
    </section>
  );
}
