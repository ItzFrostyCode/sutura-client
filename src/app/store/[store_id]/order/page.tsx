'use client';

import { Suspense, use, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Receipt, Ruler, ShoppingCart, Sparkles, User } from 'lucide-react';
import StatusStepper, { type StepperStage } from '@/components/shared/StatusStepper';
import { useServiceOrder } from '@/components/service-order/useServiceOrder';
import OrderCustomerStep from '@/components/service-order/OrderCustomerStep';
import OrderMeasurementsStep from '@/components/service-order/OrderMeasurementsStep';
import OrderSpecsStep from '@/components/service-order/OrderSpecsStep';
import OrderInvoiceStep from '@/components/service-order/OrderInvoiceStep';
import { peso } from '@/components/service-order/orderUi';

// Same four steps, in the same order, as the shop's walk-in wizard (JobOrderWizardStepper).
const STAGE_KEYS = ['customer', 'measurements', 'specs', 'invoice'] as const;
const STAGES: StepperStage[] = [
  { key: 'customer', label: 'Customer', Icon: User },
  { key: 'measurements', label: 'Measurements', Icon: Ruler },
  { key: 'specs', label: 'Specifications', Icon: Sparkles },
  { key: 'invoice', label: 'Invoice & Payment', Icon: Receipt },
];
const LAST_STEP = STAGES.length;

function Centered({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh flex flex-col items-center justify-center bg-canvas px-6 text-center">{children}</div>;
}

function ServiceOrderContent({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  const { store_id: storeId } = use(params);
  const o = useServiceOrder(storeId);

  // Repairs have their own request form (damage notes + repair items).
  useEffect(() => {
    if (o.isRepairOnly && o.service) o.router.replace(`/store/${storeId}/repair-request?service_id=${o.service.id}`);
  }, [o.isRepairOnly, o.service, o.router, storeId]);

  // Each step starts at the top, not wherever the last one was scrolled to.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [o.step]);

  if (o.loading || o.isRepairOnly) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-canvas">
        <Loader2 size={28} className="text-ink-faint animate-spin" />
      </div>
    );
  }

  if (!o.service || !o.store) {
    return (
      <Centered>
        <p className="text-base font-semibold text-ink mb-1">This service can't be ordered right now</p>
        <p className="text-sm text-ink-muted mb-5">The shop may have paused it. You can still browse their other services.</p>
        <Link href={`/store/${storeId}?tab=services`} className="px-5 h-11 inline-flex items-center bg-taupe hover:bg-ink text-white text-sm font-semibold transition-colors">
          See the shop's services
        </Link>
      </Centered>
    );
  }

  if (o.placed) {
    return (
      <Centered>
        <div className="w-14 h-14 rounded-full bg-sage/10 flex items-center justify-center mb-4">
          <CheckCircle2 size={28} className="text-sage" />
        </div>
        <h1 className="text-lg font-bold text-ink mb-1.5">Order sent to {o.store.name}</h1>
        <p className="text-sm text-ink-muted mb-1 tabular-nums">
          Order {o.placed.order_number} · Tracking code {o.placed.tracking_code}
        </p>
        <p className="text-sm text-ink-muted max-w-xs mb-6">
          The shop will review it and confirm the price. We'll notify you when it's accepted.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Link href={`/account/orders/${o.placed.id}`} className="px-5 h-12 inline-flex items-center justify-center bg-taupe hover:bg-ink text-white text-sm font-semibold transition-colors">
            View My Order
          </Link>
          <Link href={`/store/${storeId}`} className="px-5 h-12 inline-flex items-center justify-center border border-line text-ink text-sm font-semibold hover:border-taupe transition-colors">
            Back to the shop
          </Link>
        </div>
      </Centered>
    );
  }

  const nextDisabled = !o.stepReady[o.step];
  const onNext = () => (o.step < LAST_STEP ? o.setStep(o.step + 1) : void o.submit());

  return (
    <div className="min-h-dvh flex flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-50 bg-surface border-b border-line px-3.5 h-[52px] sm:h-[56px] flex items-center relative shadow-xs">
        <button
          type="button"
          onClick={() => (o.step > 1 ? o.setStep(o.step - 1) : o.router.back())}
          aria-label="Back"
          className="w-11 h-11 -ml-1.5 rounded-full flex items-center justify-center text-ink hover:text-taupe hover:bg-sunken/40 transition-colors active:scale-95"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="mobile-h3 font-semibold text-ink text-center flex-1 pr-10">Online Order</h1>
      </header>

      <main className="flex-1 mobile-screen-margins py-4 pb-[calc(120px+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-xl mx-auto">
          <p className="mb-3 text-sm font-semibold text-ink">{o.store.name}</p>
          <div className="mb-6">
            <StatusStepper stages={STAGES} currentKey={STAGE_KEYS[o.step - 1]} layout="horizontal" />
          </div>

          {o.step === 1 && <OrderCustomerStep o={o} />}
          {o.step === 2 && <OrderMeasurementsStep o={o} />}
          {o.step === 3 && <OrderSpecsStep o={o} />}
          {o.step === 4 && <OrderInvoiceStep o={o} />}
        </div>
      </main>

      <footer
        className="fixed bottom-0 left-0 right-0 max-w-[599px] mx-auto z-40 bg-surface border-t border-x border-line px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        {o.step < LAST_STEP && o.estimatedTotal !== null && o.pieces > 0 && (
          <p className="flex justify-between text-sm text-ink-muted mb-2 tabular-nums">
            <span>Estimated total</span>
            <span className="font-semibold text-ink">{peso(o.estimatedTotal)}</span>
          </p>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="w-full h-[52px] bg-taupe hover:bg-ink text-white text-base font-semibold rounded-none transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {o.step < LAST_STEP && (
            <>
              <span>Continue</span>
              <ArrowRight size={18} />
            </>
          )}
          {o.step === LAST_STEP && (o.submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Placing order…</span>
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              <span>Place Order</span>
            </>
          ))}
        </button>
      </footer>
    </div>
  );
}

export default function ServiceOrderPage({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-canvas">
          <Loader2 size={28} className="text-ink-faint animate-spin" />
        </div>
      }
    >
      <ServiceOrderContent params={params} />
    </Suspense>
  );
}
