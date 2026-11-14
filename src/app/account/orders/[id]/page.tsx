'use client';

import { paymentPolicyLabel } from '@/components/jobs/requirements';
import { use, useEffect, useState } from 'react';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { AlertCircle } from 'lucide-react';
import OrderTrackingView, { type TrackedOrder } from '@/components/shared/OrderTrackingView';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';
import EmptyState from '@/components/account/EmptyState';
import PayForOrder from '@/components/account/orders/PayForOrder';
import QuotationApprovalCard from '@/components/shared/QuotationApprovalCard';
import OrderPaymentsCard from '@/components/account/orders/OrderPaymentsCard';
import OrderClaimsSection from '@/components/account/orders/OrderClaimsSection';

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

  // The shop approves a payment, rejects one, or moves the order to the next stage: show it without a reload.
  // Every 15 seconds while this tab is open, and at once when the customer comes back to it. Stops once the order is closed.
  const stillOpen = !!order && !['completed', 'cancelled', 'rejected'].includes(order.status);
  useLiveRefresh(() => { void load(); }, 15_000, stillOpen);

  return (
    <div>
      <AccountHeader title="Order Details" backHref="/account/orders" />

      {loading && (
        <div className="text-center py-16 text-sm text-ink-muted">Loading your order…</div>
      )}

      {!loading && notFound && (
        <EmptyState Icon={AlertCircle} title="Order not found" message="This order doesn't exist or doesn't belong to your account." action={{ href: '/account/orders', label: 'Back to My Job Orders' }} />
      )}

      {!loading && !notFound && order && (() => {
        // On the ordering flow the deposit comes after the customer approves the quotation.
        const payActive = !['cancelled', 'rejected', 'completed'].includes(order.status) && !(order.quotation_flow && order.status === 'pending' && !order.quotation_flow.approved_at);
        const showPay = payActive && order.balance > 0;
        const payments = order.payments ?? [];
        const canReport = order.status === 'completed';
        return (
        <>
          <OrderTrackingView
            order={order}
            before={order.quotation_flow ? (
              <QuotationApprovalCard orderId={Number(id)} flow={order.quotation_flow} status={order.status} dueDate={order.due_date} onApproved={load} />
            ) : null}
            // The side column: Pay for this order (while there is something to pay), then Your Payments (each payment and
            // the shop's decision), then Report a problem on a completed order, then the related appointments.
            aside={showPay || payments.length > 0 || canReport ? (
              <div className="space-y-4">
              {showPay && <PayForOrder
                orderId={Number(id)}
                storeSlug={order.store?.slug}
                branchId={order.store_branch_id}
                totalAmount={order.total_amount}
                balance={order.balance}
                pending={order.pending_payment_amount ?? 0}
                requiredDeposit={order.required_deposit ?? 0}
                depositLabel={paymentPolicyLabel(order.payment_policy, order.payment_policy_percent)}
                active={payActive}
                onSubmitted={load}
              />}
              {payments.length > 0 && <OrderPaymentsCard payments={payments} canPayAgain={showPay} />}
              {canReport && <OrderClaimsSection orderId={Number(id)} storeSlug={order.store?.slug} />}
              </div>
            ) : null}
          />
        </>
        );
      })()}
    </div>
  );
}
