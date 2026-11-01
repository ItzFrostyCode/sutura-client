import type { LegalSectionData } from './legalTypes';

/**
 * The contents list. On desktop it sits beside the text and follows the reader; below 1024px it is a row of numbered
 * chips pinned under the header, so the list never takes the screen.
 */
export default function LegalContents({ sections, active, onPick }: { readonly sections: readonly LegalSectionData[]; readonly active: number | null; readonly onPick: (n: number) => void }) {
  return (
    <>
      <nav aria-label="Contents" className="sticky top-[52px] z-30 -mx-4 border-b border-line bg-canvas/90 backdrop-blur-xl sm:top-[60px] sm:-mx-6 lg:hidden">
        <ol className="flex gap-1.5 overflow-x-auto px-4 py-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => (
            <li key={s.n} className="shrink-0">
              <button type="button" onClick={() => onPick(s.n)} aria-label={`${s.n}. ${s.title}`} aria-current={active === s.n ? 'true' : undefined}
                className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold tabular-nums transition-colors ${active === s.n ? 'bg-espresso text-white' : 'bg-sunken text-ink-muted'}`}>{s.n}</button>
            </li>
          ))}
        </ol>
      </nav>

      <nav aria-label="Contents" className="sticky top-24 hidden self-start lg:block">
        <p className="mobile-overline text-taupe">Contents</p>
        <ol className="mt-3 border-l border-line-strong">
          {sections.map((s) => (
            <li key={s.n}>
              <button type="button" onClick={() => onPick(s.n)} aria-current={active === s.n ? 'true' : undefined}
                className={`-ml-px flex min-h-9 w-full gap-3 border-l-2 py-1.5 pl-4 pr-2 text-left text-sm transition-colors ${active === s.n ? 'border-espresso font-semibold text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}>
                <span className="w-5 shrink-0 tabular-nums">{s.n}</span><span>{s.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
