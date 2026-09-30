import React from 'react';
import { Tag } from 'lucide-react';
import { STORE_SPECIALIZATIONS } from '@/lib/storeSpecializations';

interface SpecializationBadgesProps {
  readonly specializations?: string[];
}

// Specializations were only ever shown back to the store's own owner on the
// settings form — customers browsing the store's About tab never saw them
// at all. Surfacing them here is what actually answers "what does this shop
// specialize in" for a visitor, not just for the owner editing it.
export default function SpecializationBadges({ specializations }: SpecializationBadgesProps) {
  if (!specializations || specializations.length === 0) return null;

  const labels = specializations.map((id) => STORE_SPECIALIZATIONS.find((s) => s.value === id)?.label || id);

  return (
    <div className="bg-surface border border-line p-3.5 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted shrink-0">
        <Tag size={13} className="text-taupe" /> Specializes in:
      </span>
      {labels.map((label) => (
        <span key={label} className="px-2.5 py-1 text-xs font-medium bg-canvas border border-line text-ink-body">
          {label}
        </span>
      ))}
    </div>
  );
}
