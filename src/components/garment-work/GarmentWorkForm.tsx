'use client';

import { Check } from 'lucide-react';
import { peso } from '@/components/service-order/orderMath';
import { Optional, SectionLabel, TEXTAREA } from '@/components/service-order/orderUi';
import OrderPhotoPicker from '@/components/service-order/OrderPhotoPicker';
import type { GarmentWorkState } from './useGarmentWork';

/** One job the shop can do, as a whole-row checkbox with its price on the right. */
function WorkRow({ label, price, on, onToggle }: Readonly<{ label: string; price: string; on: boolean; onToggle: () => void }>) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={onToggle}
      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${on ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-line-strong'} bg-surface`}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? 'border-ink bg-ink text-white' : 'border-line-strong'}`}>
        {on && <Check size={14} strokeWidth={3} aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 break-words text-base text-ink">{label}</span>
      <span className="shrink-0 whitespace-nowrap text-base font-semibold tabular-nums text-ink">{price}</span>
    </button>
  );
}

/** The questions, in the order the shop needs them: the garment, the work, its condition, the details, photos. */
export default function GarmentWorkForm({ w }: Readonly<{ w: GarmentWorkState }>) {
  const { copy } = w;
  const from = w.startingPrice ? 'from ' : '';
  return (
    <div className="space-y-8">
      <div>
        <SectionLabel htmlFor="work-item">{copy.itemLabel}</SectionLabel>
        <textarea id="work-item" rows={2} maxLength={500} value={w.item} onChange={(e) => w.setItem(e.target.value)} placeholder={copy.itemPlaceholder} className={TEXTAREA} />
      </div>

      <fieldset>
        <SectionLabel as="legend" hint={copy.workHint}>{copy.workLabel}</SectionLabel>
        <div className="space-y-2">
          {(w.service?.pricing ?? []).map((p) => (
            <WorkRow key={p.id} label={p.label} price={w.quoted ? 'Quoted' : `${from}${peso(Number(p.amount || 0))}`} on={w.picked.includes(p.id)} onToggle={() => w.toggle(p.id)} />
          ))}
        </div>
      </fieldset>

      <div>
        <SectionLabel htmlFor="work-condition" hint="Any stain, tear or wear already there before you hand it over. It protects you and the shop.">
          How is the garment now?
        </SectionLabel>
        <button type="button" role="checkbox" aria-checked={w.noDamage} onClick={() => w.setNoDamage(!w.noDamage)}
          className="mb-2 flex min-h-11 items-center gap-2 rounded-lg px-1 text-base text-ink">
          <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${w.noDamage ? 'border-ink bg-ink text-white' : 'border-line-strong'}`}>
            {w.noDamage && <Check size={14} strokeWidth={3} aria-hidden />}
          </span>
          No damage
        </button>
        {!w.noDamage && (
          <textarea id="work-condition" rows={2} maxLength={2000} value={w.condition} onChange={(e) => w.setCondition(e.target.value)}
            placeholder="e.g. Small fray on the back pocket" className={TEXTAREA} />
        )}
      </div>

      <div>
        <SectionLabel htmlFor="work-detail" hint={copy.detailHint}>
          {copy.detailLabel}{!copy.detailRequired && <Optional />}
        </SectionLabel>
        <textarea id="work-detail" rows={2} maxLength={500} value={w.detail} onChange={(e) => w.setDetail(e.target.value)} placeholder={copy.detailPlaceholder} className={TEXTAREA} />
      </div>

      <div>
        <SectionLabel as="p" hint={copy.photosHint}>Photos<Optional /></SectionLabel>
        <OrderPhotoPicker storeId={w.storeId} photos={w.photos} onChange={w.setPhotos} alt="Photo of the garment" />
      </div>
    </div>
  );
}
