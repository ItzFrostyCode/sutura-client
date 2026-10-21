import { useState } from 'react';
import SearchPicker from '@/components/shared/SearchPicker';
import { canonicalGarment, categoryOfGarment, type GarmentCategory } from '@/lib/garmentTaxonomy';
import { FIELD, LABEL } from './FormStep';
import { X } from 'lucide-react';
import { BTN_GREY } from '@/components/shared/plainForm';
import { CUSTOM_PREFIX, type GarmentOption } from './jobFormHelpers';

interface Props {
  readonly options: GarmentOption[];
  readonly garment: string;
  readonly onGarment: (slugOrName: string, category?: GarmentCategory | '') => void;
}

/**
 * One search box for the garment — type "barong", "gown", "pants"… The shop's own garments come first, every garment in
 * the taxonomy is findable, and names the shop typed on a design appear too. No category to choose first.
 */
export default function GarmentStep({ options, garment, onGarment }: Props) {
  const [typing, setTyping] = useState(false);
  const known = canonicalGarment(garment);
  const value = known ?? (garment ? CUSTOM_PREFIX + garment : '');
  // A name typed by hand that no design uses yet still has to be selectable, or the box would show nothing.
  const items = value.startsWith(CUSTOM_PREFIX) && !options.some((o) => o.id === value)
    ? [{ id: value, label: garment, group: 'Other garments', mine: true, search: garment }, ...options]
    : options;

  const choose = (id: string) => {
    if (!id) onGarment('', '');
    else if (id.startsWith(CUSTOM_PREFIX)) onGarment(id.slice(CUSTOM_PREFIX.length), 'other');
    else onGarment(id, categoryOfGarment(id) ?? '');
  };

  return (
    <div>
      <label htmlFor="job-garment" className={LABEL}>
        Garment <span className="font-normal text-ink-faint">(optional — filled from the service; change it if it is wrong)</span>
      </label>
      <SearchPicker
        id="job-garment" plain items={items} value={value} onChange={choose}
        getId={(o) => o.id} getText={(o) => o.label} getSearchText={(o) => o.search}
        placeholder="Search a garment — barong, gown, pants…" emptyText="No garment like that. Use “Not listed?” below."
        renderItem={(o) => (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{o.label}</span>
            <span className="shrink-0 text-xs text-ink-muted">{o.mine ? <span className="mr-2 font-semibold text-espresso">Yours</span> : null}{o.group}</span>
          </>
        )}
      />
      {typing ? (
        <div className="relative mt-2">
          <input
            type="text" maxLength={100} autoFocus value={known ? '' : garment} onChange={(e) => onGarment(e.target.value, 'other')}
            placeholder="Type the garment, e.g. Kimono, Malong" className={`${FIELD} pr-12`}
          />
          <button type="button" aria-label="Close and go back to the list" onClick={() => { setTyping(false); if (!known) onGarment('', ''); }} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-espresso/60 hover:bg-espresso/[0.06] hover:text-espresso">
            <X size={18} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setTyping(true)} className={`${BTN_GREY} mt-2`}>Not listed? Type the garment name</button>
      )}
    </div>
  );
}
