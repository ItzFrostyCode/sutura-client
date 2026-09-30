'use client';

import { Clock, XCircle } from 'lucide-react';
import type { Store } from '@/store/useAuthStore';

interface StoreApplicationGateProps {
  readonly store: Store;
  readonly onLogout: () => void;
}

// Shown in place of the dashboard while a new shop's application is
// pending or was rejected. The store is already hidden from every public
// page server-side (they filter on status=approved); this just keeps the
// owner out of a workspace for a shop that isn't live yet.
export default function StoreApplicationGate({ store, onLogout }: StoreApplicationGateProps) {
  const rejected = store.status === 'rejected';
  const Icon = rejected ? XCircle : Clock;

  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center mobile-screen-margins py-12">
      <div className="w-full max-w-lg border border-line bg-surface p-6 sm:p-8">
        <Icon size={32} className={rejected ? 'text-danger' : 'text-taupe'} />
        <p className="mobile-overline text-ink-muted mt-5">{store.name}</p>
        <h1 className="mobile-h1 text-ink mt-2">{rejected ? 'Application not approved' : 'Your shop is under review'}</h1>

        {rejected ? (
          <>
            <p className="mobile-body-md text-ink-body mt-3">The SUTURA team reviewed your application and couldn&apos;t approve it yet.</p>
            {store.rejection_reason && (
              <div className="mt-5 border-l-2 border-danger bg-danger/5 px-4 py-3">
                <p className="mobile-overline text-danger">Reason</p>
                <p className="mobile-body-md text-ink mt-1">{store.rejection_reason}</p>
              </div>
            )}
            <p className="mobile-body-sm text-ink-muted mt-5">Reply to the email we sent you with the corrected documents, and we&apos;ll take another look.</p>
          </>
        ) : (
          <>
            <p className="mobile-body-md text-ink-body mt-3">
              We&apos;re checking your documents and payment. Once approved, your store profile goes live and this page opens
              your full dashboard. We&apos;ll email you as soon as it&apos;s decided.
            </p>
            <p className="mobile-body-sm text-ink-muted mt-4">Reviews usually take 1–2 business days.</p>
          </>
        )}

        {/* No "Browse SUTURA" — shop accounts don't use the customer side
            (ShopRouteGuard would just send them back here). */}
        <button type="button" onClick={onLogout} className="btn-primary-mobile rounded-none! mt-8 w-full bg-ink text-white uppercase tracking-widest text-sm">
          Sign Out
        </button>
      </div>
    </div>
  );
}
