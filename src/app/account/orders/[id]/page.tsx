'use client';

import { paymentPolicyLabel } from '@/components/jobs/requirements';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import OrderTrackingView, { type TrackedOrder } from '@/components/shared/OrderTrackingView';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';
import PayForOrder from '@/components/account/orders/PayForOrder';

export default function MyOrderDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);

  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = () => api.get(`/my-orders/${id}`)
    .then((res) => setOrder(res.data.data))
    .catch(() => setNotFound(true))
    .finally(() => setLoading(false));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {!loading && !notFound && order && (
        <>
          <OrderTrackingView order={order} stepperLayout="vertical" />
          <PayForOrder
            orderId={Number(id)}
            storeSlug={order.store?.slug}
            branchId={order.store_branch_id}
            totalAmount={order.total_amount}
            balance={order.balance}
            pending={order.pending_payment_amount ?? 0}
            requiredDeposit={order.required_deposit ?? 0}
            depositLabel={paymentPolicyLabel(order.payment_policy, order.payment_policy_percent)}
            active={!['cancelled', 'rejected', 'completed'].includes(order.status)}
            onSubmitted={load}
          />
        </>
      )}
    </div>
  );
}
