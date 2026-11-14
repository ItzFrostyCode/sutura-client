'use client';

import type { ServiceOrderState } from './useServiceOrder';
import { peso, percent } from './orderMath';

function Row({ label, value, strong = false, muted = false }: Readonly<{ label: string; value: string; strong?: boolean; muted?: boolean }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className={`min-w-0 ${strong ? 'text-base font-semibold text-ink' : 'mobile-body-sm text-ink-muted'}`}>{label}</dt>
      <dd className={`shrink-0 whitespace-nowrap text-right tabular-nums ${strong ? 'text-xl font-bold text-ink' : muted ? 'mobile-body-sm text-ink-muted' : 'text-base text-ink'}`}>{value}</dd>
    </div>
  );
}

/**
 * The price, line by line, worked out live from the choices (orderMath.ts, same as the server). A price "after
 * quotation" shows no numbers: the shop sends them.
 */
export default function OrderPriceSummary({ o }: Readonly<{ o: ServiceOrderState }>) {
  const m = o.money;
  const unit = o.option?.sold_as === 'set' ? 'set' : 'pc';
  // Quoted only when there is no total (a line without a price); lines with different prices are still priced.
  if (m.total === null) {
    return (
      <dl className="divide-y divide-line">
        <Row label={`${m.pieces} ${m.pieces === 1 ? unit : `${unit}s`}`} value="Quoted by the shop" />
        {o.f.rush && o.rushAvailable && (o.rushPerPiece !== null
          ? <Row label={`Rush ${peso(o.rushPerPiece)} × ${m.pieces}`} value={`+${peso(m.rushFee ?? 0)}`} />
          : <Row label={`Rush (${percent(o.rushPercent)})`} value="Added to the quote" />)}
        <Row label="Total" value="After quotation" strong />
      </dl>
    );
  }
  const due = m.dueBeforeProduction;
  return (
    <dl className="divide-y divide-line">
      {/* Like a POS slip: one line per option, its price × how many (a group with 8 sets and 2 blouses shows two lines). */}
      {m.lines.map((l) => (
        <Row key={`${l.label}-${l.unit}`} label={`${m.lines.length > 1 || o.option ? `${l.label} · ` : ''}${peso(l.unit ?? 0)} × ${l.qty}`} value={peso((l.unit ?? 0) * l.qty)} />
      ))}
      {m.fabricTotal > 0 && <Row label="Your own fabric" value={`−${peso(m.fabricTotal)}`} />}
      {(m.rushFee ?? 0) > 0 && (
        <Row label={o.rushPerPiece !== null ? `Rush ${peso(o.rushPerPiece)} × ${m.pieces}` : `Rush ${percent(o.rushPercent)}`}
          value={`+${peso(m.rushFee ?? 0)}`} />
      )}
      <Row label="Estimated total" value={peso(m.total ?? 0)} strong />
      {due !== null && due > 0 && (
        <Row label={o.f.payFull || o.policy === 'full' ? 'To pay before production' : `Deposit before production (${o.depositPercent}%)`} value={peso(due)} />
      )}
      <Row label="Pay today" value={peso(0)} muted />
      {due !== null && (m.total ?? 0) - due > 0 && <Row label="Balance at pick-up" value={peso((m.total ?? 0) - due)} />}
    </dl>
  );
}
