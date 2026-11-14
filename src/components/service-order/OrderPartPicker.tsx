'use client';

import { Check } from 'lucide-react';
import type { ServiceOrderState } from './useServiceOrder';
import { SectionLabel } from './orderUi';
import type { Area } from './orderPoints';

/** Plain line drawings of the part, so the choice reads at a glance (no icon library draws pants). */
function PartIcon({ part }: Readonly<{ part: Area }>) {
  const top = <path vectorEffect="non-scaling-stroke" d="M9 4 5 6 2 10l3 2 2-2v10h10V10l2 2 3-2-3-4-4-2c0 1.7-1.3 3-3 3S9 5.7 9 4Z" />;
  const bottom = <path vectorEffect="non-scaling-stroke" d="M6 3h12l1 18h-4.5L12 10l-2.5 11H5L6 3Zm0 3h12" />;
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      {part === 'top' && top}
      {part === 'bottom' && bottom}
      {part === 'both' && <><g transform="translate(-1 -1) scale(0.68)">{top}</g><g transform="translate(12 6) scale(0.62)">{bottom}</g></>}
    </svg>
  );
}

const PARTS: readonly { value: Area; title: string; text: string }[] = [
  { value: 'top', title: 'Top only', text: 'Polo, blouse, shirt, barong, jacket or jersey.' },
  { value: 'bottom', title: 'Bottom only', text: 'Pants, slacks, shorts or skirt.' },
  { value: 'both', title: 'Top & bottom set', text: 'One of each. The top and bottom get their own size, like L top and XL bottom.' },
];

function PartCard({ part, on, onPick, readOnly }: Readonly<{ part: (typeof PARTS)[number]; on: boolean; onPick?: () => void; readOnly?: boolean }>) {
  const look = on ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-line-strong';
  const body = (
    <>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${on ? 'bg-ink text-white' : 'bg-sunken text-ink-muted'}`}>
        <PartIcon part={part.value} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-ink">{part.title}</span>
        <span className="mobile-body-sm mt-0.5 block text-ink-muted">{part.text}</span>
      </span>
      {on && <Check size={18} className="mt-0.5 shrink-0 text-ink min-[600px]:hidden" aria-hidden />}
    </>
  );
  const cls = `flex min-w-0 items-start gap-3 rounded-xl border bg-surface p-4 text-left transition-colors min-[600px]:flex-col ${look}`;
  if (readOnly) return <div className={cls}>{body}</div>;
  return <button type="button" role="radio" aria-checked={on} onClick={onPick} className={cls}>{body}</button>;
}

/**
 * Step 2: which part of the outfit is made. It decides which sizes and measuring points come next, so each answer
 * says what it covers. When the chosen option already fixes it, the one answer shows without a choice.
 */
export default function OrderPartPicker({ o }: Readonly<{ o: ServiceOrderState }>) {
  const { f } = o;
  const locked = Boolean(o.option?.covers);
  const hint = locked && o.perPerson ? 'From the option you chose. You can pick another option for each person in the next step.'
    : locked ? 'Fixed by the option you chose.'
    : f.mode === 'group' ? 'For everyone to start with. You can change it per person in the next step.'
      : 'This decides which sizes and measurements we ask next.';

  if (locked) {
    const part = PARTS.find((p) => p.value === o.area);
    return (
      <div>
        <SectionLabel as="p" hint={hint}>What part are you ordering?</SectionLabel>
        {part && <PartCard part={part} on readOnly />}
      </div>
    );
  }
  return (
    <fieldset>
      <SectionLabel as="legend" hint={hint}>What part are you ordering?</SectionLabel>
      <div role="radiogroup" aria-label="What part are you ordering" className="grid grid-cols-1 gap-2 min-[600px]:grid-cols-3">
        {PARTS.map((p) => <PartCard key={p.value} part={p} on={f.areaChoice === p.value} onPick={() => f.setAreaChoice(p.value)} />)}
      </div>
    </fieldset>
  );
}
