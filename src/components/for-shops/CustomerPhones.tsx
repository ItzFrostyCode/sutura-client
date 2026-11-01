import PhoneMock from './PhoneMock';

const SERVICES = [
  { name: 'Barong Tagalog', meta: 'Made to measure · from ₱3,200' },
  { name: 'School uniform', meta: 'Per piece · ₱650' },
  { name: 'Alterations', meta: 'Hem, waist · ₱150' },
] as const;

const STAGES = ['Request sent', 'Quote approved', 'Being made', 'Ready for pickup'] as const;

/** What the customer sees on their phone: a shop page, and the order tracker. Illustrative. */
export default function CustomerPhones() {
  return (
    <div className="flex items-start justify-center gap-4">
      <PhoneMock>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Dela Cruz Tailoring</p>
            <p className="mobile-caption text-ink-muted">Davao City · Open now</p>
          </div>
          <span className="shrink-0 rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-semibold text-sage">Verified</span>
        </div>
        <ul className="mt-3">
          {SERVICES.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-2 border-t border-line py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-ink">{s.name}</span>
                <span className="block truncate text-[11px] text-ink-muted">{s.meta}</span>
              </span>
              <span className="shrink-0 rounded-lg border border-line-strong px-2.5 py-1 text-[11px] font-semibold text-ink">Book</span>
            </li>
          ))}
        </ul>
      </PhoneMock>
      <PhoneMock className="hidden sm:block">
        <p className="text-sm font-semibold text-ink">My order</p>
        <p className="mobile-caption text-ink-muted">Barong Tagalog · ORD-0042</p>
        <ol className="mt-3">
          {STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-2.5 border-t border-line py-2.5 text-xs text-ink">
              <span className={`h-2 w-2 shrink-0 rounded-full ${i < 3 ? 'bg-sage' : 'border border-ink-faint'}`} />
              <span className={i === 2 ? 'font-semibold' : i === 3 ? 'text-ink-muted' : ''}>{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 rounded-lg bg-sunken px-3 py-2 text-[11px] text-ink-body">Balance ₱1,600 due at pickup</p>
      </PhoneMock>
    </div>
  );
}
