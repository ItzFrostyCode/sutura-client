import { Clock } from 'lucide-react';

/**
 * Automatic ID and face verification is not built yet. This says so, in the amber "in progress" colour, and lets the
 * owner carry on: the SUTURA team checks the documents by hand in the meantime.
 */
export default function VerificationNotice({ className = '' }: { readonly className?: string }) {
  return (
    <div role="note" className={`flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 ${className}`}>
      <Clock size={18} className="mt-0.5 shrink-0 text-amber-700" />
      <p className="mobile-body-sm text-amber-800">
        <span className="mr-2 rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">In progress</span>
        Automatic ID and face verification is still being built. You can continue: the SUTURA team checks your documents by hand.
      </p>
    </div>
  );
}
