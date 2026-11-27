'use client';

import { paymentPolicyLabel } from '@/components/jobs/requirements';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import OrderTrackingView, { type TrackedOrder } from '@/components/shared/OrderTrackingView';
import api from '@/lib/axios';
import { useLiveRefresh } from '@/lib/liveUpdates';
import AccountHeader from '@/components/account/AccountHeader';
import PayForOrder from '@/components/account/orders/PayForOrder';
import OrderClaimsSection from '@/components/account/orders/OrderClaimsSection';
import OrderStoreRatingCard from '@/components/account/orders/OrderStoreRatingCard';

function OrderDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse" aria-label="Loading order details">
      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-sunken" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-sunken" />
              <div className="h-5 w-24 rounded bg-sunken" />
            </div>
          </div>
          <div className="h-6 w-24 rounded-full bg-sunken" />
        </div>
        <div className="px-4 sm:px-5 py-4 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-12 rounded-xl bg-sunken" />
          <div className="h-12 rounded-xl bg-sunken" />
          <div className="h-12 rounded-xl bg-sunken" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-surface border border-line rounded-2xl p-5 h-64" />
        <div className="lg:col-span-5 bg-surface border border-line rounded-2xl p-5 h-36" />
      </div>
    </div>
  );
}

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

  // The tracker moves on its own as the shop updates the order.
  useLiveRefresh(['jobs', 'orders', 'payments'], () => {
    api.get(`/my-orders/${id}`).then((res) => setOrder(res.data.data)).catch(() => {});
  }, { enabled: !!id && !notFound });

  return (
    <div className="w-full">
      <AccountHeader title="Order Details" backHref="/account/orders" />
      <div className="max-w-4xl mx-auto">
        <h1 className="hidden md:block text-2xl font-bold tracking-tight text-ink mb-4">
          Order Details
        </h1>
      </div>

      {loading && <OrderDetailSkeleton />}

      {!loading && notFound && (
        <div className="max-w-4xl mx-auto bg-surface border border-line rounded-2xl p-8 text-center">
          <AlertCircle size={28} className="text-danger mx-auto mb-3" />
          <h2 className="text-base font-bold text-ink mb-1">Order not found</h2>
          <p className="text-sm text-ink-muted mb-6">This order doesn&apos;t exist or doesn&apos;t belong to your account.</p>
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center h-10 px-5 rounded-full border border-line-strong text-sm font-semibold text-ink hover:bg-sunken transition-colors"
          >
            Back to My Job Orders
          </Link>
        </div>
      )}

      {!loading && !notFound && order && (
        <>
          {/* Paying comes first, so it's never below a long progress stepper. Same width as the tracker. */}
          <div className="max-w-4xl mx-auto">
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
          </div>
          <OrderTrackingView
            order={order}
            stepperLayout="vertical"
            asideExtra={order.status === 'completed' ? (
              <>
                <OrderStoreRatingCard
                  storeSlug={order.store?.slug}
                  storeName={order.store?.name}
                  status={order.status}
                />
                <OrderClaimsSection orderId={Number(id)} storeSlug={order.store?.slug} status={order.status} />
              </>
            ) : undefined}
          />
        </>
      )}
    </div>
  );
}
