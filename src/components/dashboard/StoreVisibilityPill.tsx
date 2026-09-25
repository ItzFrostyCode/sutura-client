import React from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface ShopVisibilityPillProps {
  readonly shopVisible: boolean | null;
  readonly toggleVisibility: () => Promise<void>;
  readonly visibilityLoading: boolean;
}

// Extracted out of DashboardAlerts so it can sit beside the KPI row instead
// of stacked in its own section below it (per owner request) — same compact
// pill, same behavior, just a different spot in the page layout.
export default function ShopVisibilityPill({ shopVisible, toggleVisibility, visibilityLoading }: ShopVisibilityPillProps) {
  if (shopVisible === null) return null;

  return (
    <div
      title={shopVisible ? 'Customers can find and book your shop.' : 'Your shop is hidden from the public catalog.'}
      className="inline-flex items-center gap-2.5 bg-surface border border-line rounded-full pl-3 pr-1.5 py-1.5 w-fit shrink-0"
    >
      {shopVisible
        ? <Eye size={14} className="text-sage shrink-0" />
        : <EyeOff size={14} className="text-ink-faint shrink-0" />
      }
      <span className="text-xs font-semibold text-ink whitespace-nowrap">
        <span className={shopVisible ? 'text-sage' : 'text-ink-faint'}>{shopVisible ? 'Public' : 'Hidden'}</span>
      </span>
      <button
        onClick={toggleVisibility}
        disabled={visibilityLoading}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
          shopVisible ? 'bg-sage' : 'bg-[#D1C7BD]'
        } disabled:opacity-60 cursor-pointer`}
        aria-label="Toggle shop visibility"
      >
        {visibilityLoading
          ? <Loader2 size={9} className="absolute left-1 animate-spin text-white" />
          : <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              shopVisible ? 'translate-x-[18px]' : 'translate-x-1'
            }`} />
        }
      </button>
    </div>
  );
}
