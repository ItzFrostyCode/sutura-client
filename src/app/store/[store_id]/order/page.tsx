'use client';

import { Suspense, use, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Receipt, Ruler, Shirt, Sparkles, User } from 'lucide-react';
import { useFullPage } from '@/hooks/useFullPage';
import StatusStepper, { type StepperStage } from '@/components/shared/StatusStepper';
import FlowProgress from '@/components/shared/FlowProgress';
import { STEPS, useServiceOrder } from '@/components/service-order/useServiceOrder';
import OrderDetailsStep from '@/components/service-order/OrderDetailsStep';
import OrderWhatStep from '@/components/service-order/OrderWhatStep';
import OrderSizesStep from '@/components/service-order/OrderSizesStep';
import OrderStyleStep from '@/components/service-order/OrderStyleStep';
import OrderReviewStep from '@/components/service-order/OrderReviewStep';
import OrderPlaced from '@/components/service-order/OrderPlaced';
import { OrderFooter, OrderSidebar } from '@/components/service-order/OrderActions';

const ICONS = [User, Shirt, Ruler, Sparkles, Receipt];
const STAGES: StepperStage[] = STEPS.map((s, i) => ({ key: s.key, label: s.label, Icon: ICONS[i] }));

const Spinner = () => (
  <div className="flex min-h-dvh items-center justify-center bg-canvas"><Loader2 size={28} className="animate-spin text-ink-faint" /></div>
);

function ServiceOrderContent({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  const { store_id: storeId } = use(params);
  // A flow always fills the whole window, even when it was opened inside the search map's panel.
  useFullPage();
  const o = useServiceOrder(storeId);

  // Repairs keep their own request form (damage notes + repair items).
  useEffect(() => {
    if (o.isRepairOnly && o.service) o.router.replace(`/store/${storeId}/repair-request?service_id=${o.service.id}`);
  }, [o.isRepairOnly, o.service, o.router, storeId]);
  // Each step starts at the top.
  useEffect(() => { window.scrollTo({ top: 0 }); }, [o.step]);

  if (o.data.loading || o.isRepairOnly) return <Spinner />;
  if (!o.service || !o.store) {
    return (
      <main className="mobile-screen-margins flex min-h-dvh flex-col items-center justify-center bg-canvas text-center">
        <h1 className="mobile-h2 text-ink">This service can&apos;t be ordered right now</h1>
        <p className="mobile-body-sm mt-1 text-ink-muted">The shop may have paused it. Its other services are still open.</p>
        <Link href={`/store/${storeId}?tab=services`} className="mt-6 flex h-12 items-center rounded-xl bg-ink px-5 text-base font-semibold text-white">See the shop&apos;s services</Link>
      </main>
    );
  }
  if (o.placed) return <OrderPlaced o={o} />;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-50 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-2 min-[600px]:h-[60px]">
          <button type="button" onClick={() => (o.step > 1 ? o.setStep(o.step - 1) : o.router.back())}
            aria-label={o.step > 1 ? `Back to ${STEPS[o.step - 2].label.toLowerCase()}` : 'Leave the order'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-sunken"><ArrowLeft size={22} /></button>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-base font-semibold text-ink">Order online</h1>
            <p className="mobile-caption truncate text-ink-muted">{o.store.name}</p>
          </div>
          <span className="w-11 shrink-0" aria-hidden />
        </div>
      </header>

      <main className="mobile-screen-margins flex-1 py-6 pb-[calc(160px+env(safe-area-inset-bottom))] lg:pb-16">
        <div className="mx-auto w-full max-w-xl min-[600px]:max-w-2xl lg:grid lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
          <div className="min-w-0">
            {/* Phone: the step by name, how many, the next one. 600px and up: every step in a row. */}
            <FlowProgress labels={STEPS.map((s) => s.label)} current={o.step} className="mb-8 min-[600px]:hidden" />
            <div className="mb-8 hidden min-[600px]:block"><StatusStepper stages={STAGES} currentKey={STEPS[o.step - 1].key} layout="horizontal" /></div>
            {o.step === 1 && <OrderDetailsStep o={o} />}
            {o.step === 2 && <OrderWhatStep o={o} />}
            {o.step === 3 && <OrderSizesStep o={o} />}
            {o.step === 4 && <OrderStyleStep o={o} />}
            {o.step === 5 && <OrderReviewStep o={o} />}
          </div>
          <OrderSidebar o={o} />
        </div>
      </main>

      <OrderFooter o={o} />
    </div>
  );
}

export default function ServiceOrderPage({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  return (
    <Suspense fallback={<Spinner />}>
      <ServiceOrderContent params={params} />
    </Suspense>
  );
}
