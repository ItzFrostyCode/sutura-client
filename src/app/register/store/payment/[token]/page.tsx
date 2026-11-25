'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';
import GcashCheckoutModal, { type CheckoutOutcome } from '@/components/shared/GcashCheckoutModal';
import api from '@/lib/axios';
import { formatPeso } from '@/components/store-application/applicationTypes';

interface PaymentSummary {
  shop: string | null;
  plan: string | null;
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  paid: boolean;
  paid_at: string | null;
  reference: string | null;
  application_status: 'pending' | 'approved' | 'rejected';
  refund_status: 'pending' | 'succeeded' | 'failed' | null;
  refund_amount: number | null;
  can_pay: boolean;
}

// Where an applicant lands after paying their plan with GCash (and the page to come
// back to if they didn't finish). No sign-in exists yet: the token in the link is the key.
export default function ApplicationPaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PaymentSummary | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [cameBackFailed, setCameBackFailed] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const arrival = useRef<{ failed: boolean; openNow: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/public/plan-payments/${token}`);
      setData(res.data.data);
    } catch {
      setNotFound(true);
    }
  }, [token]);

  // Opens the GCash checkout in a modal (the server reuses a still-open link).
  const pay = useCallback(async () => {
    setOpening(true);
    setError('');
    try {
      const res = await api.post(`/public/plan-payments/${token}/checkout`);
      setCameBackFailed(false);
      setCheckoutUrl(res.data.data.checkout_url);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      setError(Object.values(e.response?.data?.errors ?? {})[0]?.[0] || e.response?.data?.message || 'Could not open GCash. Please try again.');
    } finally {
      setOpening(false);
    }
  }, [token]);

  useEffect(() => {
    // Loaded inside the checkout modal (GCash's return trip): the page that holds the modal handles it.
    if (window.self !== window.top) return;
    // Read the address once: dev mode runs this effect twice, and the first run cleans it.
    arrival.current ??= (() => {
      const params = new URLSearchParams(window.location.search);
      if (params.has('gcash') || params.has('pay')) window.history.replaceState(null, '', window.location.pathname);
      // ?pay=1: straight from submitting the application, so open GCash right away.
      return { failed: params.get('gcash') === 'failed', openNow: params.get('pay') === '1' };
    })();
    const { failed, openNow } = arrival.current;
    const t = setTimeout(() => {
      setCameBackFailed(failed);
      load();
      if (openNow && arrival.current) {
        arrival.current.openNow = false;
        pay();
      }
    }, 0);
    return () => clearTimeout(t);
  }, [load, pay]);

  const isCheckoutPaid = useCallback(async () => {
    const res = await api.get(`/public/plan-payments/${token}`);
    return Boolean(res.data.data.paid);
  }, [token]);

  const finishCheckout = (outcome: CheckoutOutcome) => {
    setCheckoutUrl(null);
    setCameBackFailed(outcome === 'failed');
    setData(null);
    load();
  };

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />
      <main className="flex-1 mobile-screen-margins py-8 sm:py-12">
        <div className="mx-auto w-full max-w-xl sm:border sm:border-line sm:bg-surface sm:p-8">
          <h1 className="mobile-h1 text-ink">Shop application payment</h1>

          {notFound && (
            <p className="mobile-body-md text-ink-body mt-4">
              We couldn&apos;t find this payment. Check that you opened the full link, or contact SUTURA support.
            </p>
          )}

          {!data && !notFound && (
            <p role="status" className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 size={16} className="animate-spin" /> Checking your GCash payment…
            </p>
          )}

          {data && (
            <>
              <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-line py-4 text-sm">
                <dt className="text-ink-muted">Shop</dt>
                <dd className="font-semibold text-ink break-words">{data.shop}</dd>
                <dt className="text-ink-muted">Plan</dt>
                <dd className="text-ink">{data.plan} · {data.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}</dd>
                <dt className="text-ink-muted">Amount</dt>
                <dd className="font-semibold text-ink tabular-nums">{formatPeso(data.amount)}</dd>
                {data.reference && (
                  <>
                    <dt className="text-ink-muted">Reference</dt>
                    <dd className="font-mono text-ink break-all">{data.reference}</dd>
                  </>
                )}
              </dl>

              <Status data={data} cameBackFailed={cameBackFailed} />

              {error && <p role="alert" className="mt-4 border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}

              {data.can_pay && (
                <button type="button" onClick={pay} disabled={opening}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-ink px-6 text-sm font-semibold uppercase tracking-widest text-white hover:bg-ink/90 disabled:opacity-60 cursor-pointer sm:w-auto">
                  {opening ? <Loader2 size={16} className="animate-spin" /> : null}
                  Pay with GCash
                </button>
              )}

              <Link href="/" className="mt-6 inline-block text-sm font-semibold text-ink underline underline-offset-4">
                Back to SUTURA
              </Link>
            </>
          )}
        </div>
      </main>

      <GcashCheckoutModal url={checkoutUrl} isPaid={isCheckoutPaid} onFinish={finishCheckout} />
    </div>
  );
}

function Status({ data, cameBackFailed }: { readonly data: PaymentSummary; readonly cameBackFailed: boolean }) {
  const refund = data.refund_status && data.refund_amount != null ? formatPeso(data.refund_amount) : null;

  if (data.application_status === 'rejected') {
    return (
      <Note Icon={XCircle} tone="text-ink-body">
        Your application was not approved. We sent the reason to your email.
        {refund && data.refund_status === 'succeeded' && <> {refund} was refunded to your GCash.</>}
        {refund && data.refund_status === 'pending' && <> Your {refund} refund is on its way to your GCash.</>}
        {refund && data.refund_status === 'failed' && <> Your refund needs attention; the SUTURA team will contact you.</>}
      </Note>
    );
  }
  if (data.application_status === 'approved') {
    return <Note Icon={CheckCircle2} tone="text-emerald-800">Your shop is approved. Check your email for your shop login.</Note>;
  }
  if (data.paid) {
    return (
      <Note Icon={CheckCircle2} tone="text-emerald-800">
        Payment received. Our team will review your application, usually within 1–2 business days, and email your shop login once it&apos;s approved.
        If it isn&apos;t approved, your payment is refunded to your GCash.
      </Note>
    );
  }
  if (cameBackFailed) {
    return <Note Icon={XCircle} tone="text-red-700">The GCash payment didn&apos;t go through and you weren&apos;t charged. Your application is saved — pay below to finish.</Note>;
  }
  return (
    <Note Icon={Clock} tone="text-amber-800">
      Your application is saved, but we haven&apos;t received your payment yet. If you just paid, refresh this page in a minute. Otherwise, pay below to finish.
    </Note>
  );
}

function Note({ Icon, tone, children }: { readonly Icon: typeof Clock; readonly tone: string; readonly children: React.ReactNode }) {
  return (
    <p role="status" className={`mt-5 flex gap-3 mobile-body-md ${tone}`}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

