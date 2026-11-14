'use client';

import Image from 'next/image';
import { ArrowRight, Loader2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { STEPS, type ServiceOrderState } from './useServiceOrder';
import OrderPriceSummary from './OrderPriceSummary';
import { peso } from './orderMath';

/** What the main button says it will do: go to the named next step, or send the order (and that nothing is paid). */
export function ctaLabel(step: number): string {
  return step < STEPS.length ? `Continue to ${STEPS[step].label.toLowerCase()}` : 'Place order · pay nothing today';
}

function Cta({ o }: Readonly<{ o: ServiceOrderState }>) {
  const problem = o.problem(o.step);
  const last = o.step === STEPS.length;
  return (
    <>
      {problem && <p id="order-cta-why" className="mobile-body-sm mb-2 text-ink-muted">{problem}</p>}
      <button
        type="button" disabled={Boolean(problem) || o.submitting} aria-describedby={problem ? 'order-cta-why' : undefined}
        onClick={() => (last ? void o.submit() : o.setStep(o.step + 1))}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-base font-semibold text-white transition-opacity active:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {o.submitting ? <><Loader2 size={18} className="animate-spin" /> Sending your order…</> : <><span className="truncate">{ctaLabel(o.step)}</span>{!last && <ArrowRight size={18} className="shrink-0" />}</>}
      </button>
    </>
  );
}

/** Phones and tablets: the button docked at the bottom, with the running total above it. */
export function OrderFooter({ o }: Readonly<{ o: ServiceOrderState }>) {
  const total = o.money.total;
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[599px] border-x border-t border-line bg-surface px-4 pt-3 min-[600px]:max-w-[680px] lg:hidden"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
      {o.step < STEPS.length && (
        <p className="mobile-body-sm mb-2 flex justify-between gap-3 tabular-nums text-ink-muted">
          <span>Estimated total</span>
          <span className="font-semibold text-ink">{total !== null ? peso(total) : 'After quotation'}</span>
        </p>
      )}
      <Cta o={o} />
    </footer>
  );
}

/** Desktop: the service, the live price and the button, beside the form. */
export function OrderSidebar({ o }: Readonly<{ o: ServiceOrderState }>) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-4 rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sunken">
            {o.service?.image_url && <Image src={getMediaUrl(o.service.image_url)} alt="" fill sizes="56px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">{o.service?.name}</p>
            <p className="mobile-body-sm truncate text-ink-muted">{o.store?.name}</p>
          </div>
        </div>
        <OrderPriceSummary o={o} />
        <Cta o={o} />
      </div>
    </aside>
  );
}
