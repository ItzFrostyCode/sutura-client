import { Crown, Lock } from 'lucide-react';

interface PlanTierTagProps {
  readonly plan: 'Pro' | 'Premium';
  readonly className?: string;
}

/** Inline "Pro" or "Premium" lock pill shown on gated nav items, dropdown rows, tabs, and actions before clicking. */
export default function PlanTierTag({ plan, className = '' }: PlanTierTagProps) {
  const isPremium = plan === 'Premium';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${
        isPremium
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-line bg-sunken text-ink-muted'
      } ${className}`}
    >
      {isPremium ? <Crown size={10} aria-hidden="true" /> : <Lock size={10} aria-hidden="true" />}
      {plan}
    </span>
  );
}
