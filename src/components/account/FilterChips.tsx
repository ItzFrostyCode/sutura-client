interface FilterChipsProps {
  readonly options: readonly { key: string; label: string; count?: number }[];
  readonly active: string;
  readonly onChange: (key: string) => void;
  readonly label: string;
}

/** A scrolling row of soft round chips (the dark one is chosen). The 44px tap height is drawn outside the 36px chip. */
export default function FilterChips({ options, active, onChange, label }: FilterChipsProps) {
  return (
    <div role="tablist" aria-label={label} className="hide-scrollbar flex gap-2 overflow-x-auto py-1">
      {options.map((o) => {
        const on = active === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.key)}
            className={`relative h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm transition-colors before:absolute before:inset-x-0 before:-inset-y-1 ${on ? 'bg-ink font-semibold text-white' : 'bg-sunken text-ink-muted'}`}
          >
            {o.label}
            {o.count !== undefined && <span className={`ml-1.5 ${on ? 'text-white/70' : 'text-ink-faint'}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
