import { useMemo, useState } from 'react';
import { Check, Shirt, ImageOff, Search } from 'lucide-react';
import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import { getMediaUrl } from '@/lib/media';
import { designPriceLabel } from '@/lib/designPricing';
import { BTN_SM, PLAIN_FIELD } from '@/components/shared/plainForm';
import { LABEL } from './FormStep';

interface Props {
  /** Only the chosen service's designs. */
  readonly designs: CatalogItem[];
  readonly selected: CatalogItem | null;
  readonly serviceName: string;
  readonly onPick: (id: string) => void;
  readonly onClear: () => void;
  /** The design is the one the customer chose when booking. */
  readonly fromBooking?: boolean;
  /** Pictures the customer sent with the booking, when none of the shop's designs was named. */
  readonly customerPhotos?: string[];
}

const FIRST = 8;
/** More designs than this: a search box appears. */
const SEARCH_FROM = 8;

/** A design's picture: tries each of its photos until one loads, then says the file is missing instead of showing a broken icon. */
function DesignImage({ item, className }: Readonly<{ item: CatalogItem; className: string }>) {
  const urls = [...(item.images ?? [])].sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary))).map((i) => i.image_url).concat(item.fabric_image_url ?? []).filter(Boolean) as string[];
  const [at, setAt] = useState(0);
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden bg-espresso/[0.04] text-espresso/40 ${className}`}>
      {urls.length === 0 ? <Shirt size={22} /> : at >= urls.length ? (
        <span className="flex flex-col items-center gap-1 px-2 text-center text-[11px]"><ImageOff size={18} />Photo not found</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={urls[at]} src={getMediaUrl(urls[at])} alt="" onError={() => setAt((n) => n + 1)} className="h-full w-full object-cover" />
      )}
    </span>
  );
}

/**
 * The chosen service's own designs. Nothing is chosen until a "Choose" button is pressed: the pictures alone are only
 * a catalog. Optional: no design means the shop makes it to order.
 */
export default function DesignStrip({ designs, selected, serviceName, onPick, onClear, fromBooking, customerPhotos = [] }: Props) {
  const [all, setAll] = useState(false);
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? designs.filter((d) => d.name.toLowerCase().includes(q)) : designs;
  }, [designs, query]);

  if (selected) {
    return (
      <div>
        <span className={LABEL}>Design <span className="font-normal text-espresso/60">{fromBooking ? 'chosen by the customer' : 'chosen'}</span></span>
        <div className="flex items-center gap-3 border-y border-espresso/15 py-3">
          <DesignImage item={selected} className="h-20 w-20 rounded-md" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-espresso"><Check size={15} className="shrink-0" /><span className="truncate">{selected.name}</span></span>
            <span className="block truncate text-sm text-espresso/60">{designPriceLabel(selected.pricing, selected.price)}</span>
          </span>
          <button type="button" onClick={onClear} className={BTN_SM}>Choose another</button>
        </div>
      </div>
    );
  }
  const theirs = customerPhotos.length > 0;
  if (designs.length === 0 && !theirs) return <p className="text-sm text-espresso/60">{serviceName} has no designs yet. It will be made to order.</p>;
  const shown = all || query ? matches : matches.slice(0, FIRST);
  return (
    <div className="space-y-3">
      <div>
        <span className={LABEL}>Design <span className="font-normal text-espresso/60">(optional)</span></span>
        {theirs ? (
          <>
            <p className="text-sm text-espresso/60">The customer sent their own picture with the booking, so no shop design was named. If it is one of the designs of {serviceName} below, press <strong className="font-semibold text-espresso">Choose</strong> under it. If not, leave it: the shop makes it from their picture.</p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {customerPhotos.map((u) => (
                <li key={u} className="h-24 w-24 overflow-hidden rounded-md border border-espresso/15 bg-espresso/[0.04]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <a href={getMediaUrl(u)} target="_blank" rel="noopener noreferrer"><img src={getMediaUrl(u)} alt="Sent by the customer" className="h-full w-full object-cover" /></a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-espresso/60">No design is chosen yet. These are the designs of {serviceName}: press <strong className="font-semibold text-espresso">Choose</strong> under the one to use. Without one, the shop makes it to order.</p>
        )}
      </div>
      {designs.length > SEARCH_FROM && (
        <label className="relative block">
          <span className="sr-only">Search designs</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${designs.length} designs`} className={`${PLAIN_FIELD} pl-9`} />
        </label>
      )}
      {designs.length > 0 && <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {shown.map((d) => (
          <li key={d.id} className="space-y-2">
            <DesignImage item={d} className="aspect-square w-full rounded-md" />
            <span className="block min-w-0">
              <span className="block truncate text-sm font-semibold text-espresso">{d.name}</span>
              <span className="block truncate text-xs text-espresso/60">{designPriceLabel(d.pricing, d.price)}</span>
            </span>
            <button type="button" onClick={() => onPick(String(d.id))} className={`${BTN_SM} w-full`}>Choose</button>
          </li>
        ))}
        {shown.length === 0 && <li className="col-span-full py-4 text-sm text-espresso/60">No design matches “{query}”.</li>}
      </ul>}
      {!query && designs.length > FIRST && <button type="button" onClick={() => setAll((v) => !v)} className={BTN_SM}>{all ? 'Show fewer' : `Show all ${designs.length} designs`}</button>}
    </div>
  );
}
