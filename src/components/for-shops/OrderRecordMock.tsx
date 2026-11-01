const ROWS = [
  { label: 'Booked a fitting', value: 'Mon, 9:12 AM', sub: 'Customer account', done: true },
  { label: 'Measured', value: 'Sat, 2:24 PM', sub: 'Chest, waist, length', done: true },
  { label: 'Quote approved', value: '₱3,200', sub: 'Deposit ₱1,600 verified', done: true },
  { label: 'Being made', value: 'Sewing', sub: 'Moved by staff', done: false },
  { label: 'Balance', value: '₱1,600', sub: 'Paid at handover', done: false },
] as const;

/** One sample order, drawn the way the shop sees it. Fictional names and figures; the caption says so. */
export default function OrderRecordMock() {
  return (
    <figure>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_8px_24px_rgba(43,30,26,0.08)]">
        <div className="flex items-center justify-between gap-3 bg-espresso px-4 py-3 text-white sm:px-5">
          <span className="mobile-overline">Order record</span>
          <span className="text-xs tabular-nums text-amber-300">ORD-0042</span>
        </div>
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xl font-semibold text-ink">Ana R.</p>
              <p className="mobile-body-sm text-ink-muted">Barong Tagalog · 1 piece · Davao City</p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Being made</span>
          </div>
          <ul className="mt-4">
            {ROWS.map((r) => (
              <li key={r.label} className="flex items-start justify-between gap-3 border-t border-line py-3">
                <span className="flex items-center gap-2.5 text-sm text-ink">
                  <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${r.done ? 'bg-sage' : 'border border-ink-faint'}`} />
                  {r.label}
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold tabular-nums text-ink">{r.value}</span>
                  <span className="block mobile-caption text-ink-muted">{r.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="mobile-caption mt-3 text-ink-muted">A sample order. Names and figures are illustrative.</figcaption>
    </figure>
  );
}
