// Same sample board as the team lead's For Shops page (real stage names: cutting, sewing, ready).
const COLUMNS = [
  { name: 'New requests', jobs: [{ who: 'Carlo M.', what: 'Uniform set' }] },
  { name: 'Cutting', jobs: [{ who: 'Joy D.', what: 'Filipiniana' }, { who: 'Ben T.', what: 'Suit' }] },
  { name: 'Sewing', jobs: [{ who: 'Ana R.', what: 'Barong Tagalog' }, { who: 'Lito R.', what: 'Hemming' }] },
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
                <span className="min-w-0 whitespace-nowrap tracking-normal">{c.name}</span>
                <span className="ml-2 shrink-0 tabular-nums">{c.jobs.length}</span>
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
      <figcaption className="mobile-caption mt-3 text-ink-muted">A sample board. Cards move as your staff work.</figcaption>
    </figure>
  );
}
