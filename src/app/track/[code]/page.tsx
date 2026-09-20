'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import OrderTrackingView, { type TrackedOrder } from '@/components/shared/OrderTrackingView';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function TrackResultPage({ params }: Readonly<{ params: Promise<{ code: string }> }>) {
  const { code } = use(params);
  const router = useRouter();
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
      <div className="sticky top-0 z-50 bg-surface border-b border-line px-4 h-[50px] flex items-center justify-center relative">
        <button
          type="button"
          onClick={() => router.push('/track')}
          aria-label="Back"
          className="absolute left-4 p-1 text-ink-muted"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold text-ink">Track Order</h1>
      </div>
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-10">
        {loading && (
          <div className="text-center py-16 text-sm text-ink-muted">Looking up your order…</div>
        )}

        {!loading && notFound && (
          <div className="bg-surface border border-line rounded-2xl p-10 text-center">
            <AlertCircle size={28} className="text-danger mx-auto mb-3" />
            <h1 className="text-base font-bold text-ink mb-1">No order found</h1>
            <p className="text-sm text-ink-muted mb-6">
              No order found for tracking code <span className="font-mono font-semibold">{code}</span>. Double-check the code and try again.
            </p>
            <Link href="/track" className="text-sm font-medium text-taupe hover:text-taupe-hover">
              Try another code
            </Link>
          </div>
        )}

        {!loading && !notFound && order && <OrderTrackingView order={order} stepperLayout="vertical" />}
      </main>
    </div>
  );
}
