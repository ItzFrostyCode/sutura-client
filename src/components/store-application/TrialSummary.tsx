import { Check } from 'lucide-react';

const INCLUDED = [
  'Everything in the Basic plan: appointments, measurements, job orders and order tracking',
  'Your shop listed on SUTURA and on the map once it is approved',
  'Nothing to pay and no receipt to upload',
] as const;

/** The free-trial path's last step: what the 14 days include and when they start. No plans, no payment. */
export default function TrialSummary() {
  return (
    <div className="rounded-xl border border-line bg-sunken p-4">
      <p className="text-base font-semibold text-ink">Free trial · 14 days</p>
      <ul className="mt-3 space-y-2">
        {INCLUDED.map((t) => (
          <li key={t} className="flex gap-2 mobile-body-sm text-ink-body"><Check size={16} className="mt-0.5 shrink-0 text-sage" aria-hidden />{t}</li>
        ))}
      </ul>
      <p className="mobile-caption mt-3 text-ink-muted">The 14 days start when the SUTURA team approves your shop, not today. Choose a plan any time before they end.</p>
    </div>
  );
}
