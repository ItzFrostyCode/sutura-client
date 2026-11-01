const OPTIONS = [
  { value: true, label: 'Free trial', hint: '₱0 for 14 days' },
  { value: false, label: 'Choose a plan', hint: 'Pay with a receipt' },
] as const;

/** Start with the free trial (Basic's features) or pick and pay for a plan now. */
export default function TrialChoice({ trial, onChange }: { readonly trial: boolean; readonly onChange: (trial: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="How to start">
      {OPTIONS.map((o) => (
        <button key={o.label} type="button" role="radio" aria-checked={trial === o.value} onClick={() => onChange(o.value)}
          className={`min-h-14 rounded-xl border px-3 py-2 text-left transition-colors ${trial === o.value ? 'border-ink bg-sunken' : 'border-line-strong bg-surface hover:border-ink'}`}>
          <span className="block text-sm font-semibold text-ink">{o.label}</span>
          <span className="block mobile-caption text-ink-muted">{o.hint}</span>
        </button>
      ))}
    </div>
  );
}
