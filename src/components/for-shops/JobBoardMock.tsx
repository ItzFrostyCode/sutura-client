const COLUMNS = [
  { name: 'Request', jobs: [{ who: 'Carla M.', what: 'Filipiniana' }] },
  { name: 'Getting ready', jobs: [{ who: 'Joy D.', what: 'School uniform' }, { who: 'Ben T.', what: 'Polo' }] },
  { name: 'Being made', jobs: [{ who: 'Ana R.', what: 'Barong Tagalog' }, { who: 'Lito P.', what: 'Suit' }] },
  { name: 'Ready', jobs: [{ who: 'Mia S.', what: 'Gown' }] },
] as const;

/** The job board as the shop sees it. One panel, flat columns, no cards inside cards. */
export default function JobBoardMock() {
  return (
    <figure>
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_3px_rgba(43,30,26,0.04),0_4px_12px_rgba(43,30,26,0.02)] sm:p-5">
        <p className="text-sm font-semibold text-ink">Job orders</p>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {COLUMNS.map((c) => (
            <div key={c.name} className="min-w-0">
              <p className="flex items-center justify-between border-b border-line-strong pb-2 mobile-overline text-ink-muted">
                <span className="truncate">{c.name}</span>
                <span className="ml-2 tabular-nums">{c.jobs.length}</span>
              </p>
              <ul>
                {c.jobs.map((j) => (
                  <li key={j.who} className="border-b border-line py-3">
                    <p className="truncate text-sm font-semibold text-ink">{j.who}</p>
                    <p className="truncate mobile-caption text-ink-muted">{j.what}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mobile-caption mt-3 text-ink-muted">A sample board. Each stage ends in one button.</figcaption>
    </figure>
  );
}
