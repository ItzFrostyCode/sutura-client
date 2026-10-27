import React from 'react';
import { Store } from 'lucide-react';

interface DeclaredBranchesCardProps {
  readonly branches: { name: string; address: string }[] | null | undefined;
  /** Owner view: says how to turn these into real, bookable locations. */
  readonly isOwner?: boolean;
}

// "Other branches" listed at registration — display only. Real branches
// (map pin, booking) live in Branches and need the Premium plan.
export default function DeclaredBranchesCard({ branches, isOwner = false }: DeclaredBranchesCardProps) {
  if (!branches?.length) return null;

  return (
    <div className="bg-surface border border-line p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-3">
        <Store size={16} className="text-taupe" aria-hidden="true" />
        <h3 className="mobile-h4 text-ink">Other Branches</h3>
      </div>
      <ul className="divide-y divide-line">
        {branches.map((b) => (
          <li key={b.name} className="py-2.5 first:pt-0 last:pb-0">
            <p className="text-sm font-semibold text-ink">{b.name}</p>
            <p className="text-sm text-ink-muted break-words">{b.address}</p>
          </li>
        ))}
      </ul>
      {isOwner && (
        <p className="mt-4 mobile-caption text-ink-muted">
          Listed for display only. Upgrading to a Premium Plan is required to activate and set up individual branches.
        </p>
      )}
    </div>
  );
}
