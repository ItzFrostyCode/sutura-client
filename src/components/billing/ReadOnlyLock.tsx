'use client';

import { READ_ONLY_HINT, useCurrentShopReadOnly } from '@/hooks/useShopReadOnly';

/**
 * Wraps an action (button or link) that changes the shop. On a read-only shop
 * (plan ended, server: CheckRole) it is shown greyed out, can't be clicked or
 * reached by keyboard (inert), and explains why on hover. Otherwise it renders
 * the child untouched. `className` sizes the wrapper (e.g. w-full, flex-1).
 */
export default function ReadOnlyLock({ children, className = '' }: Readonly<{ children: React.ReactNode; className?: string }>) {
  const readOnly = useCurrentShopReadOnly();
  if (!readOnly) return <>{children}</>;
  return (
    <span title={READ_ONLY_HINT} aria-disabled="true" className={`inline-flex cursor-not-allowed ${className}`}>
      <span inert className="pointer-events-none inline-flex w-full opacity-50">{children}</span>
    </span>
  );
}
