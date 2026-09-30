import React from 'react';
import { EyeOff, Lock, Zap } from 'lucide-react';
import Link from 'next/link';

interface StoreVisibilityToggleProps {
  readonly isFeatured: boolean;
  readonly isHidden: boolean;
  readonly onHiddenChange: (value: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange, badge }: {
  readonly label: string; readonly description: string; readonly checked: boolean;
  readonly onChange: () => void; readonly badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-semibold text-ink flex items-center gap-2">{label} {badge}</div>
        <p className="text-xs text-ink-muted mt-0.5 max-w-sm">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`shrink-0 relative w-11 h-6 rounded-full transition-colors cursor-pointer ${checked ? 'bg-taupe' : 'bg-line'}`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

// Featured placement is NOT a toggle the owner controls here — it's kept
// automatically in sync with the store's active subscription plan
// (SubscriptionController::subscribe() / ExpireSubscriptions on the
// backend). This just reports the current, system-decided status.
export default function StoreVisibilityToggle({ isFeatured, isHidden, onHiddenChange }: StoreVisibilityToggleProps) {
  return (
    <div className="divide-y divide-line/60">
      <ToggleRow
        label="Store Visible to Customers"
        description={isHidden ? "Hidden — customers can't find or view your store right now." : 'Turn this off to temporarily take your store down without deleting anything.'}
        checked={!isHidden}
        onChange={() => onHiddenChange(!isHidden)}
        badge={isHidden && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sunken text-ink-muted border border-line">
            <EyeOff size={10} /> Hidden
          </span>
        )}
      />
      <div className="flex items-center justify-between gap-4 py-3">
        <div>
          <div className="text-sm font-semibold text-ink flex items-center gap-2">Featured Store Placement</div>
          <p className="text-xs text-ink-muted mt-0.5 max-w-sm">
            {isFeatured
              ? 'Automatically on — Premium plans are pinned at the top of relevant customer search results.'
              : 'Upgrade to Premium and this turns on automatically — no need to set it yourself.'}
          </p>
        </div>
        {isFeatured ? (
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
            <Zap size={10} /> Active
          </span>
        ) : (
          <Link href="/dashboard/billing" className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors">
            <Lock size={12} /> Upgrade
          </Link>
        )}
      </div>
    </div>
  );
}
