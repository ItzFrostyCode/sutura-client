import React from 'react';
import { EyeOff } from 'lucide-react';

interface StoreVisibilityToggleProps {
  /** Not shown here: featured placement follows the plan automatically (shown as a badge on the card). */
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
        className={`shrink-0 relative w-11 h-6 rounded-full transition-colors cursor-pointer ${checked ? 'bg-espresso' : 'bg-line'}`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

// Featured placement is NOT a setting — it follows the shop's plan automatically (SubscriptionController::subscribe() /
// ExpireSubscriptions on the backend), so nothing about it is asked here.
export default function StoreVisibilityToggle({ isHidden, onHiddenChange }: StoreVisibilityToggleProps) {
  return (
    <div className="divide-y divide-line/60">
      <ToggleRow
        label="Shop Visible to Customers"
        description={isHidden ? "Hidden — customers can't find or view your shop right now." : 'Turn this off to temporarily take your shop down without deleting anything.'}
        checked={!isHidden}
        onChange={() => onHiddenChange(!isHidden)}
        badge={isHidden && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sunken text-ink-muted border border-line">
            <EyeOff size={10} /> Hidden
          </span>
        )}
      />
    </div>
  );
}
