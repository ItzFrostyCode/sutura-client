interface SegmentedTabsProps<T extends string> {
  readonly options: readonly { key: T; label: string; shortLabel?: string }[];
  readonly active: T;
  readonly onChange: (key: T) => void;
  readonly label: string;
}

/** An iOS segmented control across the full width: the chosen segment is a white pill with a soft shadow. */
export default function SegmentedTabs<T extends string>({ options, active, onChange, label }: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="mb-4 flex rounded-[10px] bg-sunken p-0.5">
      {options.map((o) => {
        const on = active === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.key)}
            className={`relative h-9 flex-1 rounded-[8px] text-sm transition-colors before:absolute before:inset-x-0 before:-inset-y-1 ${on ? 'bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(45,42,38,0.12)]' : 'text-ink-muted'}`}
          >
            <span className="sm:hidden">{o.shortLabel ?? o.label}</span>
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
