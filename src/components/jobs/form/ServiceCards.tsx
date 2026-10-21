'use client';

import { useMemo, useState } from 'react';
import { Check, Clock, Heart, Scissors, Search, Star } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { formatTurnaround } from '@/lib/formatTurnaround';
import { SERVICE_GROUPS, type ServiceGroupKey } from '@/lib/garmentTaxonomy';
import { peso } from './jobFormHelpers';
import { BTN_SM, PLAIN_FIELD } from '@/components/shared/plainForm';
import { Chip } from './FormStep';
import type { ServiceData } from './types';

/** More than this many services: a search box and category chips appear so a long list stays easy to use. */
const SEARCH_FROM = 6;

function Thumb({ url, size }: Readonly<{ url?: string | null; size: string }>) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-espresso/[0.04] text-ink-faint ${size}`}>
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getMediaUrl(url)} alt="" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : <Scissors size={20} />}
    </span>
  );
}

const kindOf = (s: ServiceData) => (s.service_category && s.service_category in SERVICE_GROUPS ? SERVICE_GROUPS[s.service_category as ServiceGroupKey].label : null);

function Price({ s }: Readonly<{ s: ServiceData }>) {
  const price = Number(s.base_price);
  return price > 0 ? <>From <strong className="font-semibold text-ink">{peso(price)}</strong></> : <span className="text-ink-muted">Price on consultation</span>;
}

/** The chosen service, in full, with a way to change it. */
function Chosen({ s, onChange }: Readonly<{ s: ServiceData; onChange: () => void }>) {
  const rating = Number(s.reviews_avg_rating);
  return (
    <div className="flex items-center gap-3 border-y border-espresso/15 px-1 py-3">
      <Thumb url={s.image_url} size="h-14 w-14" />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block truncate text-[15px] font-semibold text-ink">{s.name}</span>
        {kindOf(s) && <span className="block truncate text-xs text-ink-muted">{kindOf(s)}</span>}
        <span className="block text-sm text-ink-body"><Price s={s} /></span>
        <span className="flex flex-nowrap items-center gap-x-2 overflow-hidden whitespace-nowrap text-[11px] text-ink-muted">
          <span className="flex shrink-0 items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-500" /><strong className="font-semibold text-ink">{rating > 0 ? rating.toFixed(1) : '0.0'}</strong></span>
          <span aria-hidden className="text-espresso/20">|</span>
          <span className="shrink-0">{s.orders_count ?? 0} sold</span>
          <span aria-hidden className="text-espresso/20">|</span>
          <span className="flex shrink-0 items-center gap-0.5 text-rose-600"><Heart size={10} className="fill-rose-500 text-rose-500" />{s.saves_count ?? 0}</span>
          <span aria-hidden className="text-espresso/20">|</span>
          <span className="flex min-w-0 items-center gap-1 truncate"><Clock size={11} className="shrink-0 text-espresso" />{formatTurnaround(s.estimated_days, s.estimated_days_max)}</span>
        </span>
      </span>
      <button type="button" onClick={onChange} className={BTN_SM}>Change</button>
    </div>
  );
}

/**
 * What the shop offers. Once one is chosen it shows as a single row (so the page stays short, however many services the
 * shop has) with a Change button. Choosing shows a compact list: a search box and category chips when there are many,
 * and the list scrolls inside itself.
 */
export default function ServiceCards({ services, selectedId, onPick }: Readonly<{ services: ServiceData[]; selectedId: string; onPick: (id: string) => void }>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const chosen = services.find((s) => String(s.id) === selectedId);
  const kinds = useMemo(() => Array.from(new Set(services.map(kindOf).filter(Boolean))) as string[], [services]);
  const many = services.length > SEARCH_FROM;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => (!kind || kindOf(s) === kind) && (!q || s.name.toLowerCase().includes(q) || (kindOf(s) ?? '').toLowerCase().includes(q)));
  }, [services, query, kind]);

  if (services.length === 0) return <p className="text-sm text-ink-muted">This shop has no services yet. Add one under Services first.</p>;
  if (chosen && !open) return <Chosen s={chosen} onChange={() => setOpen(true)} />;

  return (
    <div className="space-y-3">
      {many && (
        <>
          <label className="relative block">
            <span className="sr-only">Search services</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${services.length} services`} className={`${PLAIN_FIELD} pl-9`} />
          </label>
          {kinds.length > 1 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {['', ...kinds].map((k) => <Chip key={k || 'all'} active={kind === k} onClick={() => setKind(k)}>{k || 'All'}</Chip>)}
            </div>
          )}
        </>
      )}
      <ul className="max-h-[22rem] divide-y divide-espresso/[0.06] overflow-y-auto overscroll-contain" role="radiogroup" aria-label="Service">
        {shown.map((s) => {
          const on = String(s.id) === selectedId;
          return (
            <li key={s.id}>
              <button type="button" role="radio" aria-checked={on} onClick={() => { onPick(String(s.id)); setOpen(false); setQuery(''); }}
                className={`flex min-h-14 w-full cursor-pointer items-center gap-3 px-2 py-2 text-left transition-colors ${on ? 'bg-espresso/[0.05]' : 'hover:bg-espresso/[0.03]'}`}>
                <Thumb url={s.image_url} size="h-11 w-11" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{s.name}</span>
                  <span className="block truncate text-xs text-ink-muted"><Price s={s} /> · {formatTurnaround(s.estimated_days, s.estimated_days_max)}</span>
                </span>
                {on && <Check size={16} className="shrink-0 text-espresso" />}
              </button>
            </li>
          );
        })}
        {shown.length === 0 && <li className="px-2 py-6 text-center text-sm text-ink-muted">No service matches “{query}”.</li>}
      </ul>
      {chosen && <button type="button" onClick={() => { setOpen(false); setQuery(''); }} className={BTN_SM}>Cancel</button>}
    </div>
  );
}
