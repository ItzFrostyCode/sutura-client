'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Loader2, Lock, X } from 'lucide-react';
import OverlayPortal from './OverlayPortal';

export type CheckoutOutcome = 'paid' | 'returned' | 'failed' | 'closed';

interface Props {
  /** The GCash checkout link; null keeps the modal closed. */
  readonly url: string | null;
  /** Asks SUTURA (which asks GCash) whether this payment is in. Polled while open. */
  readonly isPaid: () => Promise<boolean>;
  /** paid = confirmed; returned = GCash sent them back as done; failed = GCash said it failed; closed = they closed it. */
  readonly onFinish: (outcome: CheckoutOutcome) => void;
}

const POLL_MS = 5000;

// The GCash checkout, held in a modal so the payer never leaves SUTURA.
export default function GcashCheckoutModal({ url, isPaid, onFinish }: Props) {
  const [loading, setLoading] = useState(true);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const done = useRef(false);
  // Latest callbacks without restarting the poll each render.
  const isPaidRef = useRef(isPaid);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    isPaidRef.current = isPaid;
    onFinishRef.current = onFinish;
  });

  const finish = (outcome: CheckoutOutcome) => {
    if (done.current) return;
    done.current = true;
    onFinishRef.current(outcome);
  };

  useEffect(() => {
    if (!url) return;
    done.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish('closed'); };
    window.addEventListener('keydown', onKey);

    let busy = false;
    const timer = setInterval(async () => {
      if (busy || done.current) return;
      busy = true;
      try {
        if (await isPaidRef.current()) finish('paid');
      } catch {
        // A missed check is fine; the next one runs in a few seconds.
      } finally {
        busy = false;
      }
    }, POLL_MS);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [url]);

  // GCash's success/failure redirect lands on a SUTURA page, which is readable (same site)
  // while every GCash page is not. Seeing our own page in the frame means they're done.
  const onFrameLoad = () => {
    setLoading(false);
    let href = '';
    try {
      href = frameRef.current?.contentWindow?.location.href ?? '';
    } catch {
      return; // Still on GCash.
    }
    if (!href || href === 'about:blank') return;
    finish(new URL(href).searchParams.get('gcash') === 'failed' ? 'failed' : 'returned');
  };

  if (!url) return null;

  return (
    <OverlayPortal>
      {/* No close on a backdrop click: a stray tap mid-payment shouldn't drop the checkout. */}
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 sm:p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="gcash-checkout-title"
          className="flex h-dvh w-full flex-col bg-surface shadow-[0_12px_40px_rgba(0,0,0,0.25)] sm:h-[min(760px,92dvh)] sm:max-w-lg sm:border sm:border-line">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 id="gcash-checkout-title" className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Lock size={15} aria-hidden /> GCash Payment
            </h2>
            <button ref={closeRef} type="button" onClick={() => finish('closed')} aria-label="Close GCash payment"
              className="-mr-2 grid size-11 place-items-center text-ink-muted hover:bg-sunken hover:text-ink cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="relative flex-1 min-h-0">
            {loading && (
              <p role="status" className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-ink-muted">
                <Loader2 size={16} className="animate-spin" /> Opening GCash…
              </p>
            )}
            <iframe ref={frameRef} src={url} title="GCash checkout" allow="payment" onLoad={onFrameLoad}
              className={`relative size-full border-0 bg-white ${loading ? 'opacity-0' : ''}`} />
          </div>

          <div className="flex shrink-0 flex-col gap-1 border-t border-line px-4 py-3 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <span>This closes on its own once your payment goes through.</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1 font-semibold text-ink underline underline-offset-4">
              Having trouble? Open in a new tab <ArrowUpRight size={13} aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
