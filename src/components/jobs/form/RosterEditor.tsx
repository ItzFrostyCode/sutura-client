import { Trash2 } from 'lucide-react';
import { FIELD, LABEL } from './FormStep';
import type { RosterMember } from './types';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const CELL = 'h-10 w-full bg-canvas border border-line rounded-lg px-2 text-base sm:text-sm text-ink focus:outline-none focus:border-taupe';

interface Props {
  readonly teamName: string;
  readonly onTeamName: (v: string) => void;
  readonly roster: RosterMember[];
  readonly onRoster: (r: RosterMember[]) => void;
  readonly newRow: () => RosterMember;
  readonly minQty?: number;
}

/** Team / bulk order: one row per person (name, printed name, number, size). */
export default function RosterEditor({ teamName, onTeamName, roster, onRoster, newRow, minQty }: Props) {
  const edit = (id: string, patch: Partial<RosterMember>) => onRoster(roster.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const add = (n: number) => onRoster([...roster, ...Array.from({ length: n }, newRow)]);
  const short = minQty && minQty > 1 && roster.length < minQty;
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="team-name" className={LABEL}>Team / group name</label>
        <input id="team-name" type="text" value={teamName} onChange={(e) => onTeamName(e.target.value)} placeholder="e.g. Grade 10 – Sampaguita" className={`${FIELD} md:max-w-sm`} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${short ? 'text-danger' : 'text-ink-muted'}`}>
          {roster.length} piece{roster.length === 1 ? '' : 's'}{minQty && minQty > 1 ? ` · minimum ${minQty}` : ''}
        </span>
        <div className="flex gap-2">
          {[1, 5, 10].map((n) => (
            <button key={n} type="button" onClick={() => add(n)} className="min-h-10 cursor-pointer border border-line px-3 text-xs font-semibold text-ink hover:bg-sunken">+ {n}</button>
          ))}
        </div>
      </div>
      <ul className="space-y-2">
        {roster.map((r, i) => (
          <li key={r.id} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[28px_1.5fr_1fr_80px_88px_40px]">
            <span className="hidden text-xs font-semibold text-ink-faint sm:block">{i + 1}</span>
            <input aria-label={`Name ${i + 1}`} required value={r.name} onChange={(e) => edit(r.id, { name: e.target.value })} placeholder="Name" className={`${CELL} col-span-2 sm:col-span-1`} />
            <input aria-label={`Printed name ${i + 1}`} value={r.print_name} onChange={(e) => edit(r.id, { print_name: e.target.value })} placeholder="Printed name" className={CELL} />
            <input aria-label={`Number ${i + 1}`} inputMode="numeric" value={r.number} onChange={(e) => edit(r.id, { number: e.target.value })} placeholder="No." className={CELL} />
            <select aria-label={`Size ${i + 1}`} value={r.size} onChange={(e) => edit(r.id, { size: e.target.value })} className={CELL}>
              {SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button type="button" aria-label={`Remove ${i + 1}`} disabled={roster.length === 1} onClick={() => onRoster(roster.filter((x) => x.id !== r.id))} className="flex h-10 w-10 cursor-pointer items-center justify-center justify-self-end text-danger hover:bg-danger/10 disabled:opacity-30">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
