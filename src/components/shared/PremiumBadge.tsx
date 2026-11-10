import { Crown } from 'lucide-react';

/**
 * The one "Premium" mark for a shop, everywhere a shop appears (Map list, Shops near you, All Shops, the shop page).
 * Shown only when the server says the shop is on Premium right now (`is_featured` / `is_premium` from
 * Store::scopeWithPremiumNow or PlanGate) — never from a stored flag, so it cannot disagree between pages.
 */
export default function PremiumBadge({ className = '' }: { readonly className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-nav-bar px-2 py-0.5 text-xs font-semibold text-white ${className}`}>
      <Crown size={12} aria-hidden /> Premium
    </span>
  );
}
