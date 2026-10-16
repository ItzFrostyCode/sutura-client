import { useState } from 'react';
import { Shirt, Check } from 'lucide-react';
import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import { getMediaUrl } from '@/lib/media';
import { designPriceLabel } from '@/lib/designPricing';
import { LABEL } from './FormStep';
import { designImage } from './jobFormHelpers';

interface Props {
  readonly designs: CatalogItem[];
  readonly selected: CatalogItem | null;
  /** What the list is filtered by, e.g. "Dresses & Gowns". */
  readonly scope: string | null;
  readonly onPick: (id: string) => void;
  readonly onClear: () => void;
}

const FIRST = 8;

function Thumb({ item, className }: Readonly<{ item: CatalogItem; className: string }>) {
  const image = designImage(item);
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden bg-sunken ${className}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getMediaUrl(image)} alt="" className="h-full w-full object-cover" />
      ) : (
        <Shirt size={18} className="text-ink-faint" />
      )}
    </span>
  );
}

/** Optional: start from one of the shop's own designs. Picking one fills in the service, price, days and photo. */
export default function DesignStrip({ designs, selected, scope, onPick, onClear }: Props) {
  const [all, setAll] = useState(false);
  if (selected) {
    return (
      <div>
        <span className={LABEL}>Design</span>
        <div className="flex items-center gap-3 border-y border-line py-2">
          <Thumb item={selected} className="h-14 w-14" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{selected.name}</span>
            <span className="block truncate text-xs text-ink-muted">{designPriceLabel(selected.pricing, selected.price)}</span>
          </span>
          <button type="button" onClick={onClear} className="min-h-11 shrink-0 cursor-pointer px-2 text-xs font-semibold text-taupe hover:underline">Change</button>
        </div>
      </div>
    );
  }
  if (designs.length === 0) return null;
  const shown = all ? designs : designs.slice(0, FIRST);
  return (
    <div>
      <span className={LABEL}>
        Start from a design <span className="font-normal normal-case tracking-normal text-ink-faint">(optional){scope ? ` — ${scope}` : ''}</span>
      </span>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
        {shown.map((d) => (
          <li key={d.id}>
            <button type="button" onClick={() => onPick(d.id.toString())} className="group block w-full cursor-pointer text-left">
              <Thumb item={d} className="aspect-square w-full group-hover:opacity-90" />
              <span className="mt-1.5 block truncate text-xs font-semibold text-ink">{d.name}</span>
              <span className="block truncate text-xs text-ink-muted">{designPriceLabel(d.pricing, d.price)}</span>
            </button>
          </li>
        ))}
      </ul>
      {designs.length > FIRST && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 min-h-11 cursor-pointer text-sm font-semibold text-taupe hover:underline">
          {all ? 'Show fewer' : `Show all ${designs.length} designs`}
        </button>
      )}
    </div>
  );
}
