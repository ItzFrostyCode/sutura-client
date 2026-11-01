import { ChevronDown } from 'lucide-react';
import type { LegalSectionData } from './legalTypes';

const WHO = { customers: 'Customers', owners: 'Shop owners' } as const;

/** One numbered section as a row that opens in place. Closed content is also removed from tab order (`inert`). */
export default function LegalAccordion({ section, open, onToggle, showAudience }: { readonly section: LegalSectionData; readonly open: boolean; readonly onToggle: () => void; readonly showAudience: boolean }) {
  const id = `s${section.n}`;
  return (
    <section id={id} className="scroll-mt-28 border-t border-line-strong last:border-b">
      <h2>
        <button type="button" aria-expanded={open} aria-controls={`${id}-body`} onClick={onToggle}
          className="flex min-h-16 w-full items-center gap-3 py-4 text-left sm:gap-4">
          <span className="w-7 shrink-0 text-lg font-semibold tabular-nums text-amber-600 sm:w-8">{section.n}</span>
          <span className="min-w-0 flex-1 text-lg font-semibold leading-snug text-ink sm:text-xl">{section.title}</span>
          {showAudience && section.audience !== 'all' && (
            <span className="hidden shrink-0 rounded-full bg-sunken px-2.5 py-0.5 text-xs font-semibold text-ink-muted sm:inline">{WHO[section.audience]}</span>
          )}
          <ChevronDown size={20} className={`shrink-0 text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      <div id={`${id}-body`} inert={!open} className={`grid transition-[grid-template-rows] duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="space-y-4 pb-7 pl-10 pr-1 sm:pl-12">
            {section.blocks.map((b, i) => 'p' in b ? (
              <p key={i} className="mobile-body-md text-ink-body sm:text-[17px] sm:leading-7">{b.p}</p>
            ) : (
              <ul key={i} className="space-y-2.5">
                {b.ul.map((li) => (
                  <li key={li} className="flex gap-3 mobile-body-md text-ink-body sm:text-[17px] sm:leading-7">
                    <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{li}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
