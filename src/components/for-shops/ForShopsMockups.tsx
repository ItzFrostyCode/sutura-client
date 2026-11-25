import { Check, Circle, MapPin, Star } from 'lucide-react';

/*
 * Illustrations for the For shops page. Every name and amount here is a
 * sample, labelled as such on the page; nothing is read from real shops.
 */

const RECORD: { label: string; when: string; note: string; done: boolean }[] = [
  { label: 'Booked fitting', when: 'Mon, 9:12 AM', note: 'Customer booked online', done: true },
  { label: 'Measured', when: 'Sat, 2:24 PM', note: 'Saved to her profile', done: true },
  { label: 'Quote approved', when: '₱3,200', note: 'Deposit ₱1,600 recorded', done: true },
  { label: 'Being made', when: 'Sewing', note: 'Moved by your staff', done: false },
  { label: 'Balance', when: '₱1,600', note: 'Due at pickup', done: false },
];

export function OrderRecordCard() {
  return (
    <figure>
      <div className="overflow-hidden rounded-2xl border border-[#DDD4C9] bg-white shadow-[0_18px_40px_-18px_rgba(46,28,20,0.35)]">
        <div className="flex items-center justify-between bg-[#4A3428] px-5 py-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[#E9D9C3]">Order record</span>
          <span className="font-semibold text-[#E9C46A] tabular-nums">JO-1042</span>
        </div>
        <div className="px-5 pb-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-ink">Ana R.</p>
              <p className="text-xs text-ink-muted">Barong Tagalog · Poblacion · Davao City</p>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Being made</span>
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

const BOARD: { col: string; cards: { name: string; item: string }[] }[] = [
  { col: 'New requests', cards: [{ name: 'Carlo M.', item: 'Uniform set' }] },
  { col: 'Cutting', cards: [{ name: 'Joy D.', item: 'Filipiniana' }, { name: 'Ben T.', item: 'Suit' }] },
  { col: 'Sewing', cards: [{ name: 'Ana R.', item: 'Barong Tagalog' }, { name: 'Lito R.', item: 'Hemming' }] },
  { col: 'Ready', cards: [{ name: 'Mia S.', item: 'Gown' }] },
];

export function JobBoardCard() {
  return (
    <figure>
      <div className="rounded-2xl border border-[#DDD4C9] bg-white p-4 shadow-[0_12px_30px_-16px_rgba(46,28,20,0.3)]">
        <p className="mb-3 text-xs font-semibold text-ink">Job orders</p>
        <div className="grid grid-cols-4 gap-2">
          {BOARD.map(({ col, cards }) => (
            <div key={col} className="min-w-0">
              <p className="mb-2 flex items-center justify-between border-b border-[#EAE3D9] pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                <span className="truncate">{col}</span>
                <span className="tabular-nums">{cards.length}</span>
              </p>
              <div className="space-y-1.5">
                {cards.map((c) => (
                  <div key={c.name} className="rounded-lg border border-[#EAE3D9] bg-[#FBF8F4] px-2 py-1.5">
                    <p className="truncate text-[11px] font-semibold text-ink">{c.name}</p>
                    <p className="truncate text-[10px] text-ink-muted">{c.item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 text-[11px] text-ink-faint">A sample board. Cards move as your staff work.</figcaption>
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
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">Verified</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-ink-muted">
            <MapPin size={9} /> Davao City · <Star size={9} className="fill-[#D9A441] text-[#D9A441]" /> 4.8
          </p>
          <div className="mt-3 space-y-2">
            {[['Barong Tagalog', 'From ₱2,800'], ['School uniform', 'From ₱650'], ['Alterations', 'From ₱150']].map(([n, p]) => (
              <div key={n} className="flex items-center justify-between rounded-lg border border-[#EAE3D9] px-2 py-1.5">
                <span>
                  <span className="block text-[10px] font-semibold text-ink">{n}</span>
                  <span className="block text-[9px] text-ink-muted">{p}</span>
                </span>
                <span className="rounded-md bg-[#4A3428] px-1.5 py-0.5 text-[9px] font-semibold text-white">Book</span>
              </div>
            ))}
          </div>
        </Phone>
        <Phone>
          <p className="text-xs font-semibold text-ink">My order</p>
          <p className="text-[10px] text-ink-muted">Barong Tagalog · JO-1042</p>
          <ol className="mt-3 space-y-2">
            {[['Request sent', true], ['Quote approved', true], ['Being made', true], ['Ready for pickup', false]].map(([s, d]) => (
              <li key={String(s)} className="flex items-center gap-2 text-[10px]">
                {d ? <span className="h-2 w-2 rounded-full bg-[#4A3428]" /> : <span className="h-2 w-2 rounded-full border border-ink-faint" />}
                <span className={d ? 'text-ink' : 'text-ink-muted'}>{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-lg bg-[#F3EBE3] px-2 py-1.5 text-[10px] text-ink">Balance ₱1,600 due at pickup</p>
        </Phone>
      </div>
      <figcaption className="mt-3 text-center text-[11px] text-ink-faint">Sample screens. What customers see on SUTURA.</figcaption>
    </figure>
  );
}
