'use client';

import type { ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, INPUT, Optional, SectionLabel, Tip } from './orderUi';
import OrderUnitPicker from './OrderUnitPicker';
import OrderPointInputs from './OrderPointInputs';
import OrderSizePick from './OrderSizePick';
import OrderPhotoPicker from './OrderPhotoPicker';
import { sizesOf } from './OrderSizeChart';
import { EASE_TIP } from './orderPoints';
import OrderInfoTip from './OrderInfoTip';
import { CUTS, CUT_TIP } from './useMeasureColumns';

/** One person: who wears it, then how the shop gets their size, each answer opening only what it needs. */
export default function OrderIndividualSizing({ o }: Readonly<{ o: ServiceOrderState }>) {
  const { f } = o;
  const saved = o.data.saved;
  const sizes = sizesOf(o.service);
  const them = f.wearer.trim();
  // No body measurements for this service (jerseys, uniforms): the size comes from the chart, nothing else is asked.
  const chartOnly = !o.measurementsNeeded;
  const source = chartOnly ? 'standard' : f.source;

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel htmlFor="order-wearer" hint="Leave empty if it is for you. Their measurements are kept apart from yours.">Who will wear it?<Optional /></SectionLabel>
        <input id="order-wearer" type="text" maxLength={120} value={f.wearer} onChange={(e) => f.setWearer(e.target.value)} placeholder="e.g. Miguel (my son)" className={INPUT} />
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1 text-base font-semibold text-ink">Cut<span className="font-normal text-ink-faint"> (optional)</span><OrderInfoTip label="Cut" text={CUT_TIP} /></p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cut">
          {CUTS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={f.cut === c} onClick={() => f.setCut(f.cut === c ? '' : c)}
              className={`h-10 rounded-full border px-4 text-sm font-medium transition-colors ${f.cut === c ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-line-strong'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {!chartOnly && <fieldset>
        <SectionLabel as="legend">{them ? `How the shop gets ${them}'s size` : 'How the shop gets your size'}</SectionLabel>
        <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="How the shop gets the size">
          {saved.length > 0 && <ChoiceCard selected={f.source === 'saved'} onSelect={() => f.setSource('saved')} label="Use measurements on file" detail="The shop already measured you." />}
          {/* Standard sizes only mean something when the shop posted its chart. */}
          {o.hasChart && <ChoiceCard selected={f.source === 'standard'} onSelect={() => f.setSource('standard')} label="Pick a size from the chart" detail="No measuring needed." />}
          <ChoiceCard selected={f.source === 'own'} onSelect={() => f.setSource('own')} label="Enter my measurements" detail="Type them in, or attach a photo of a measurement card." />
          <ChoiceCard selected={f.source === 'shop'} onSelect={() => f.setSource('shop')} label="Have the shop measure me" detail="After accepting your order, the shop sets a measuring visit." />
        </div>
      </fieldset>}

      {source === 'saved' && saved.length > 0 && (
        <div>
          <SectionLabel htmlFor="order-profile">Measurements on file</SectionLabel>
          <select id="order-profile" value={f.measurementId ?? ''} onChange={(e) => f.setMeasurementId(e.target.value ? Number(e.target.value) : null)} className={INPUT}>
            {saved.map((m) => <option key={m.id} value={m.id}>{m.profile_name} · version {m.version}</option>)}
          </select>
        </div>
      )}

      {source === 'standard' && (
        <div className="space-y-6">
          {o.area !== 'bottom' && <OrderSizePick label={o.area === 'both' ? 'Top size' : 'Size'} sizes={sizes} value={f.size} onPick={f.setSize} />}
          {o.area === 'bottom' && <OrderSizePick label="Size" sizes={sizes} value={f.size} onPick={f.setSize} />}
          {o.area === 'both' && <OrderSizePick label="Bottom size" sizes={sizes} value={f.sizeBottom} onPick={f.setSizeBottom} />}
        </div>
      )}

      {source === 'own' && (
        <div className="space-y-6">
          <OrderUnitPicker f={f} />
          {f.unit && (
            <>
              <Tip title="How to measure">{EASE_TIP[f.unit]}</Tip>
              <OrderPointInputs area={o.area} unit={f.unit} values={f.points} idPrefix="m"
                onChange={(k, v) => f.setPoints({ ...f.points, [k]: v })} />
              <div>
                <SectionLabel as="p" hint="Instead of typing, or as a check.">Measurement card photo<Optional /></SectionLabel>
                <OrderPhotoPicker storeId={o.storeId} photos={f.sheets} onChange={f.setSheets} alt="Measurement card" />
              </div>
            </>
          )}
        </div>
      )}

      {source === 'shop' && <Tip>No measuring now. Once the shop accepts your order, it books a visit to measure you before cutting.</Tip>}
    </div>
  );
}
