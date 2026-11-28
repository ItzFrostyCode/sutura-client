import { Check, Circle, MapPin, Star } from 'lucide-react';

/*
 * Illustrations for the For shops page. Every name and amount here is a
 * sample, labelled as such on the page; nothing is read from real shops.
 */

// Mirrors a real job order: the appointment, measurements, the shop's approval with
// the deposit, the production stages, then pickup (statuses from JobOrder::STATUSES).
const RECORD: { label: string; when: string; note: string; done: boolean }[] = [
  { label: 'Fitting booked', when: 'Mon, 9:12 AM', note: 'Booked online', done: true },
  { label: 'Measured', when: 'Sat, 2:24 PM', note: 'Saved to her measurement profile', done: true },
  { label: 'Order approved', when: '₱3,200', note: '50% deposit paid · ₱1,600', done: true },
  { label: 'Production', when: 'In progress', note: 'Quality Check next', done: false },
  { label: 'Ready for pickup', when: '₱1,600', note: 'Balance due at pickup', done: false },
];

export function OrderRecordCard() {
  return (
    <figure>
      <div className="overflow-hidden rounded-2xl border border-[#DDD4C9] bg-white shadow-[0_18px_40px_-18px_rgba(46,28,20,0.35)]">
        <div className="flex items-center justify-between bg-[#4A3428] px-5 py-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[#E9D9C3]">Job order</span>
          <span className="font-semibold text-[#E9C46A] tabular-nums">ORD-0042</span>
        </div>
        <div className="px-5 pb-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-ink">Ana R.</p>
              <p className="text-xs text-ink-muted">Barong Tagalog · Poblacion · Davao City</p>
            </div>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Production</span>
          </div>
          <ol className="mt-4 divide-y divide-[#EAE3D9]">
            {RECORD.map((r) => (
              <li key={r.label} className="flex items-center gap-3 py-2.5">
                {r.done
                  ? <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#4A3428] text-white"><Check size={10} strokeWidth={3} /></span>
                  : <Circle size={16} className="shrink-0 text-ink-faint" />}
                <span className={`flex-1 text-sm ${r.done ? 'text-ink' : 'text-ink-muted'}`}>{r.label}</span>
                <span className="text-right">
                  <span className="block text-sm font-semibold text-ink tabular-nums">{r.when}</span>
                  <span className="block text-[11px] text-ink-muted">{r.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <figcaption className="mt-2 text-[11px] text-ink-faint">A sample order. Names and amounts are illustrative.</figcaption>
    </figure>
  );
}

// The same columns as the shop's Production Orders board (PRODUCTION_COLUMNS).
const BOARD: { col: string; dot: string; cards: { no: string; name: string; item: string; due: string; rush?: boolean }[] }[] = [
  { col: 'Pending', dot: 'bg-amber-400', cards: [{ no: 'ORD-0048', name: 'Carlo M.', item: 'School uniform', due: 'Due Dec 12' }] },
  { col: 'Production', dot: 'bg-blue-500', cards: [{ no: 'ORD-0042', name: 'Ana R.', item: 'Barong Tagalog', due: 'Due Dec 4', rush: true }, { no: 'ORD-0045', name: 'Ben T.', item: 'Suit', due: 'Due Dec 9' }] },
  { col: 'Quality Check', dot: 'bg-purple-500', cards: [{ no: 'ORD-0039', name: 'Joy D.', item: 'Filipiniana', due: 'Due Dec 3' }] },
  { col: 'Ready for Pickup', dot: 'bg-emerald-500', cards: [{ no: 'ORD-0036', name: 'Mia S.', item: 'Gown', due: 'Paid' }] },
];

export function JobBoardCard() {
  return (
    <figure>
      <div className="rounded-2xl border border-[#DDD4C9] bg-white p-4 shadow-[0_12px_30px_-16px_rgba(46,28,20,0.3)]">
        <p className="mb-3 text-xs font-semibold text-ink">Production Orders</p>
        <div className="grid grid-cols-4 gap-2">
          {BOARD.map(({ col, dot, cards }) => (
            <div key={col} className="min-w-0">
              <p className="mb-2 flex items-center justify-between gap-1 border-b border-[#EAE3D9] pb-1.5 text-[10px] font-semibold text-ink-muted">
                <span className="flex min-w-0 items-center gap-1"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} /><span className="truncate">{col}</span></span>
                <span className="tabular-nums">{cards.length}</span>
              </p>
              <div className="space-y-1.5">
                {cards.map((c) => (
                  <div key={c.no} className="rounded-lg border border-[#EAE3D9] bg-[#FBF8F4] px-2 py-1.5">
                    <p className="flex items-center justify-between gap-1 text-[9px] text-ink-muted tabular-nums"><span>{c.no}</span>{c.rush && <span className="rounded bg-rose-600 px-1 font-bold text-white">RUSH</span>}</p>
                    <p className="truncate text-[11px] font-semibold text-ink">{c.name}</p>
                    <p className="truncate text-[10px] text-ink-muted">{c.item}</p>
                    <p className="mt-0.5 text-[9px] font-medium text-ink-muted">{c.due}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 text-[11px] text-ink-faint">A sample board. Your staff move each card to the next stage in one tap.</figcaption>
    </figure>
  );
}

function Phone({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="w-[210px] shrink-0 rounded-[28px] border-[5px] border-[#3A2A21] bg-white p-3 shadow-[0_18px_36px_-16px_rgba(46,28,20,0.45)]">
      {children}
    </div>
  );
}

export function CustomerPhones() {
  return (
    <figure>
      <div className="flex items-start justify-center gap-4">
        <Phone>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink">Dela Cruz Tailoring</p>
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">Open now</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-ink-muted">
            <MapPin size={9} /> Poblacion, Davao City · <Star size={9} className="fill-[#D9A441] text-[#D9A441]" /> 4.8
          </p>
          <div className="mt-3 space-y-2">
            {[['Barong Tagalog', '₱2,800', 'Order'], ['School uniform', '₱650', 'Order'], ['Alteration & Repair', '₱150', 'Book']].map(([n, p, action]) => (
              <div key={n} className="flex items-center justify-between rounded-lg border border-[#EAE3D9] px-2 py-1.5">
                <span>
                  <span className="block text-[10px] font-semibold text-ink">{n}</span>
                  <span className="block text-[9px] text-ink-muted">{p}</span>
                </span>
                <span className="rounded-md bg-[#4A3428] px-1.5 py-0.5 text-[9px] font-semibold text-white">{action}</span>
              </div>
            ))}
          </div>
        </Phone>
        <Phone>
          <p className="text-xs font-semibold text-ink">My order</p>
          <p className="text-[10px] text-ink-muted">Barong Tagalog · ORD-0042</p>
          <ol className="mt-3 space-y-2">
            {[['Order received', true], ['In production', true], ['Quality check', false], ['Ready for pickup', false]].map(([s, d]) => (
              <li key={String(s)} className="flex items-center gap-2 text-[10px]">
                {d ? <span className="h-2 w-2 rounded-full bg-[#4A3428]" /> : <span className="h-2 w-2 rounded-full border border-ink-faint" />}
                <span className={d ? 'text-ink' : 'text-ink-muted'}>{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-lg bg-[#F3EBE3] px-2 py-1.5 text-[10px] text-ink">Paid ₱1,600 · ₱1,600 left at pickup</p>
        </Phone>
      </div>
      <figcaption className="mt-3 text-center text-[11px] text-ink-faint">Sample screens. What customers see on SUTURA.</figcaption>
    </figure>
  );
}
