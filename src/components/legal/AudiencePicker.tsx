import type { Audience, LegalSectionData } from './legalTypes';

export type AudienceFilter = 'all' | Exclude<Audience, 'all'>;

const OPTIONS: { value: AudienceFilter; label: string; hint: string }[] = [
  { value: 'all', label: 'Everything', hint: 'The full terms' },
  { value: 'customers', label: 'I’m a customer', hint: 'Booking and ordering' },
  { value: 'owners', label: 'I own a shop', hint: 'Running a shop on SUTURA' },
];

export const sectionsFor = (sections: readonly LegalSectionData[], audience: AudienceFilter) =>
  sections.filter((s) => audience === 'all' || s.audience === 'all' || s.audience === audience);

/** Three big choices, with how many sections each one reads. Picking one hides the sections meant only for the other. */
export default function AudiencePicker({ value, onChange, sections }: { readonly value: AudienceFilter; readonly onChange: (v: AudienceFilter) => void; readonly sections: readonly LegalSectionData[] }) {
  return (
    <div role="radiogroup" aria-label="Who is reading" className="grid gap-3 sm:grid-cols-3">
      {OPTIONS.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${on ? 'border-espresso bg-espresso text-white' : 'border-line-strong bg-surface text-ink hover:border-ink'}`}>
            <span className="min-w-0">
              <span className="block text-base font-semibold">{o.label}</span>
              <span className={`block mobile-caption ${on ? 'text-white/70' : 'text-ink-muted'}`}>{o.hint}</span>
            </span>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${on ? 'bg-white/15' : 'bg-sunken text-ink-muted'}`}>{sectionsFor(sections, o.value).length}</span>
          </button>
        );
      })}
    </div>
  );
}
