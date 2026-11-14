'use client';

import type { ServiceOrderState } from './useServiceOrder';
import { Alert, Card, StepIntro } from './orderUi';
import OrderWhenRush from './OrderWhenRush';
import OrderPaymentChoice from './OrderPaymentChoice';
import OrderPriceSummary from './OrderPriceSummary';
import OrderSummaryList from './OrderSummaryList';
import OrderNextSteps from './OrderNextSteps';

/** Step 5 — when, rush, payment, then the whole order and its price before Place order. Nothing is paid today. */
export default function OrderReviewStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  return (
    <div className="space-y-8">
      <StepIntro title="Review your order" text="Check everything below. You pay nothing today." />
      <OrderWhenRush o={o} />
      <OrderPaymentChoice o={o} />

      <section aria-labelledby="sum-title">
        <h3 id="sum-title" className="mobile-h3 mb-2 text-ink">Your order</h3>
        <Card className="!py-1"><OrderSummaryList o={o} /></Card>
      </section>

      <section aria-labelledby="price-title" className="lg:hidden">
        <h3 id="price-title" className="mobile-h3 mb-2 text-ink">Price</h3>
        <Card className="!py-2"><OrderPriceSummary o={o} /></Card>
      </section>

      <section aria-labelledby="next-title">
        <h3 id="next-title" className="mobile-h3 mb-3 text-ink">After you place the order</h3>
        <OrderNextSteps o={o} />
      </section>

      {o.error && <Alert>{o.error}</Alert>}
    </div>
  );
}
