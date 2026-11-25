'use client';

import { CheckCircle2, Clock, Loader2, X, XCircle } from 'lucide-react';
import type { OnlinePaymentResult } from './billingTypes';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });

interface Props {
  readonly result: OnlinePaymentResult;
  readonly onCheckAgain: (paymentId: number) => void;
  readonly onDismiss: () => void;
}

// What happened at GCash, shown on Billing right after the owner comes back.
export default function OnlinePaymentBanner({ result, onCheckAgain, onDismiss }: Props) {
  if (result.state === 'checking') {
    return (
      <div role="status" className="flex items-center gap-3 border border-line-strong bg-sunken p-4 text-sm text-ink">
        <Loader2 size={18} className="shrink-0 animate-spin text-taupe" /> Checking your GCash payment…
      </div>
    );
  }

  const tone = {
    paid: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    processing: 'border-amber-300 bg-amber-50 text-amber-900',
    failed: 'border-red-200 bg-red-50 text-red-800',
  }[result.state];
  const Icon = { paid: CheckCircle2, processing: Clock, failed: XCircle }[result.state];

  let body: React.ReactNode;
  if (result.state === 'paid') {
    body = result.started
      ? <>Payment received. {result.plan ? <>Your shop is on the <strong>{result.plan}</strong> plan</> : 'Your plan is updated'}{result.until ? <> until {day(result.until)}</> : ''}.</>
      : <>Payment received. The SUTURA team is checking one detail before your plan changes; you&apos;ll get a notification when it&apos;s done.</>;
  } else if (result.state === 'processing') {
    body = (
      <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span>We haven&apos;t received the GCash confirmation yet. If you finished paying, it usually arrives within a minute.</span>
        <button type="button" onClick={() => onCheckAgain(result.paymentId)} className="h-9 shrink-0 self-start border border-amber-400 bg-white px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer">
          Check again
        </button>
      </span>
    );
  } else {
    body = <>The GCash payment didn&apos;t go through and you weren&apos;t charged. Pick the plan again to try once more.</>;
  }

  return (
    <div role="status" className={`flex items-start gap-3 border p-4 text-sm ${tone}`}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="flex-1 min-w-0">{body}</div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-m-1 grid size-8 shrink-0 place-items-center hover:bg-black/5 cursor-pointer">
        <X size={16} />
      </button>
    </div>
  );
}
