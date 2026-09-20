import React from 'react';

// A full-width bar for "unlimited" used to render as solid amber — visually
// indistinguishable from "at capacity, warning," the exact opposite of what
// unlimited means. Unlimited (max === null) gets no progress bar at all,
// just the label. Shared by the Billing page and the Reports page's
// Subscription Activity section so both read the exact same usage/limit
// visual language.
export default function UsageBar({ label, used, max, icon: Icon }: {
  readonly label: string;
  readonly used: number;
  readonly max: number | null;
  readonly icon: React.ElementType;
}) {
  const pct = max === null ? 0 : Math.min((used / max) * 100, 100);
  const isAtLimit = max !== null && used >= max;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-ink-body">
          <Icon size={14} className="text-taupe" />
          <span className="font-medium">{label}</span>
        </div>
        {max === null ? (
          <span className="text-xs font-semibold text-sage">{used} used · Unlimited</span>
        ) : (
          <span className={`text-xs font-semibold ${isAtLimit ? 'text-danger' : 'text-ink-muted'}`}>
            {used} / {max}
          </span>
        )}
      </div>
      {max !== null && (
        <div className="h-2 bg-sunken rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit ? 'bg-danger' : pct > 75 ? 'bg-amber-400' : 'bg-taupe'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isAtLimit && max !== null && (
        <p className="text-[11px] text-danger">Limit reached — upgrade to add more.</p>
      )}
    </div>
  );
}
