import { Gift } from 'lucide-react';

// "Free Trial" on applications that asked for the 14-day trial instead of paying: green and a
// step larger than the status badge, so trial shops stand out at a glance.
export default function FreeTrialTag({ large = false }: { readonly large?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-600 font-semibold text-white ${
        large ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      <Gift size={large ? 15 : 13} aria-hidden="true" />
      Free Trial
    </span>
  );
}
