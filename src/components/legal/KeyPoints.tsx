import { BadgeCheck, CalendarCheck, DoorOpen, Ruler, Scissors, Wallet } from 'lucide-react';

const ICONS = { software: Scissors, pay: Wallet, adult: CalendarCheck, verify: BadgeCheck, ruler: Ruler, close: DoorOpen } as const;
export interface KeyPoint { readonly icon: keyof typeof ICONS; readonly title: string; readonly body: string }

/** "In plain words": the short version as six small, flat points instead of a box of bullets. */
export default function KeyPoints({ points }: { readonly points: readonly KeyPoint[] }) {
  return (
    <section aria-labelledby="legal-plain" className="mt-12">
      <h2 id="legal-plain" className="mobile-overline text-taupe">In plain words</h2>
      <ul className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {points.map(({ icon, title, body }) => {
          const Icon = ICONS[icon];
          return (
            <li key={title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunken text-espresso"><Icon size={20} /></span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-ink">{title}</p>
                <p className="mobile-body-sm mt-1 text-ink-muted">{body}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mobile-caption mt-6 text-ink-muted">This summary is not a substitute for the full text below.</p>
    </section>
  );
}
