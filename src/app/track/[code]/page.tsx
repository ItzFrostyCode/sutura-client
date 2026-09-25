'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import OrderTrackingView, { type TrackedOrder } from '@/components/shared/OrderTrackingView';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';

export default function TrackResultPage({ params }: Readonly<{ params: Promise<{ code: string }> }>) {
  const { code } = use(params);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setNotFound(false);
    api.get(`/track/${encodeURIComponent(code)}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />
      <main className="flex-1 max-w-2xl w-full mx-auto mobile-screen-margins py-6 sm:py-8">
        <Link
          href="/track"
          className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          Track another order
        </Link>

        {loading && (
          <div className="text-center py-16 mobile-body-sm text-ink-muted">Looking up your order…</div>
        )}

        {!loading && notFound && (
          <div className="border border-line p-6 sm:p-10 text-center">
            <AlertCircle size={24} className="text-danger mx-auto mb-3" />
            <h2 className="mobile-h2 sm:tablet-h2 text-ink mb-2">No order found</h2>
            <p className="mobile-body-sm sm:tablet-body-md text-ink-muted mb-6">
              No order found for tracking code <span className="font-mono font-medium">{code}</span>. Double-check the code and try again.
            </p>
            <Link href="/track" className="btn-secondary-mobile sm:btn-secondary-tablet text-ink border border-line bg-surface hover:bg-sunken">
              Try another code
            </Link>
          </div>
        )}

        {!loading && !notFound && order && <OrderTrackingView order={order} stepperLayout="vertical" />}
      </main>
    </div>
  );
}

