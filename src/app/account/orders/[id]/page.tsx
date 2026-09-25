'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import OrderTrackingView, { type TrackedOrder } from '@/components/shared/OrderTrackingView';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';

export default function MyOrderDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);

  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    api.get(`/my-orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <AccountHeader title="Order Details" backHref="/account/orders" />

      {loading && (
        <div className="text-center py-16 text-sm text-ink-muted">Loading your order…</div>
      )}

      {!loading && notFound && (
        <div className="bg-surface border border-line p-8 text-center">
          <AlertCircle size={28} className="text-danger mx-auto mb-3" />
          <h1 className="text-base font-bold text-ink mb-1">Order not found</h1>
          <p className="text-sm text-ink-muted mb-6">This order doesn&apos;t exist or doesn&apos;t belong to your account.</p>
          <Link href="/account/orders" className="text-sm font-medium text-taupe hover:text-taupe-hover">
            Back to My Job Orders
          </Link>
        </div>
      )}

      {!loading && !notFound && order && <OrderTrackingView order={order} stepperLayout="vertical" />}
    </div>
  );
}
