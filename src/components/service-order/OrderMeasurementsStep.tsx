'use client';

import { User, Users } from 'lucide-react';
import Segmented from '@/components/shared/Segmented';
import { ChoiceCard, SectionLabel, StepIntro, measurementCopy } from './orderUi';
import OrderBulkSizes from './OrderBulkSizes';
import OrderOptionPicker from './OrderOptionPicker';
import OrderOwnMeasurements from './OrderOwnMeasurements';
import OrderStandardSize from './OrderStandardSize';
import type { OrderArea, ServiceOrderState } from './useServiceOrder';
import { COVERS_FIELD, COVERS_HINT, COVERS_LABEL } from '@/lib/orderUnits';

const INPUT = 'w-full h-[48px] bg-canvas border border-line rounded-none px-4 text-base text-ink tabular-nums focus:outline-none focus:border-taupe placeholder:text-ink-faint';
const AREAS = (['top', 'bottom', 'both'] as const).map((value) => ({ value, label: COVERS_LABEL[value], hint: COVERS_HINT[value] }));

function ModeCard({ on, onClick, Icon, title, text }: Readonly<{ on: boolean; onClick: () => void; Icon: typeof User; title: string; text: string }>) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={`p-3.5 border text-left transition-colors flex items-start gap-3 ${on ? 'border-taupe bg-taupe/5 ring-2 ring-taupe/20' : 'border-line bg-surface hover:border-taupe/40'}`}>
      <span className={`w-9 h-9 flex items-center justify-center shrink-0 ${on ? 'bg-taupe text-white' : 'bg-canvas text-ink-muted'}`}><Icon size={18} /></span>
      <span><span className="block text-sm font-semibold text-ink">{title}</span><span className="block mobile-caption text-ink-muted mt-0.5">{text}</span></span>
    </button>
  );
}

/** One person: how the shop gets the sizes (saved, standard size, own numbers, or the shop measures), each opening only what it needs. */
function IndividualSizing({ o }: Readonly<{ o: ServiceOrderState }>) {
  const saved = o.savedMeasurements.find((m) => m.id === o.measurementId);
  const savedArea = saved?.metrics?._area;
  const coverage = o.measurementSource === 'saved' && (savedArea === 'top' || savedArea === 'bottom') && savedArea !== o.area
    ? `This profile has ${savedArea === 'top' ? 'Top' : 'Bottom'} only, but you are ordering ${AREAS.find((a) => a.value === o.area)?.label}. The shop will measure what is missing.` : '';
  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <SectionLabel htmlFor="order-wearer">Who will wear it? <span className="text-ink-faint font-normal">(Optional, leave empty if it is for you)</span></SectionLabel>
        <input id="order-wearer" type="text" maxLength={120} value={o.wearerName} onChange={(e) => o.setWearerName(e.target.value)} placeholder="e.g. my son Miguel" className={INPUT} />
        <p className="mobile-caption text-ink-muted">Their measurements are kept separately from yours.</p>
      </div>
      <fieldset className="space-y-2.5">
        <SectionLabel as="legend">{o.wearerName.trim() ? 'Their size' : 'Your size'}</SectionLabel>
        <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="How the shop gets the size">
          {o.savedMeasurements.length > 0 && <ChoiceCard selected={o.measurementSource === 'saved'} onSelect={() => o.setMeasurementSource('saved')} label="Use measurements on file" detail="This shop already measured you." />}
          <ChoiceCard selected={o.measurementSource === 'standard'} onSelect={() => o.setMeasurementSource('standard')} label="Pick a standard size" detail="Choose from the shop's size chart. No body measurements needed." />
          <ChoiceCard selected={o.measurementSource === 'own'} onSelect={() => o.setMeasurementSource('own')} label="Enter my measurements" detail="Type them in or attach a photo of your measurement card." />
          <ChoiceCard selected={o.measurementSource === 'shop'} onSelect={() => o.setMeasurementSource('shop')} label="Have the shop measure me" detail="The shop sets a fitting visit after accepting your order." />
        </div>
      </fieldset>
      {o.measurementSource === 'saved' && o.savedMeasurements.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="order-profile" className="mobile-caption font-semibold text-ink-body block">Measurement profile</label>
          <select id="order-profile" value={o.measurementId ?? ''} onChange={(e) => o.setMeasurementId(e.target.value ? Number(e.target.value) : null)} className={INPUT.replace('px-4', 'px-3')}>
            {o.savedMeasurements.map((m) => <option key={m.id} value={m.id}>{m.profile_name} · version {m.version}</option>)}
          </select>
          {coverage && <p className="text-sm font-medium text-amber-800">{coverage}</p>}
        </div>
      )}
      {o.measurementSource === 'standard' && <OrderStandardSize o={o} />}
      {o.measurementSource === 'own' && <OrderOwnMeasurements o={o} />}
    </div>
  );
}

/**
 * Step 2, as an if / else. (1) The service needs no body measurements → nothing to ask. (2) Otherwise what is ordered comes first
 * (Top, Bottom or Top & Bottom) and everything after follows it. (3) One person: how the sizes are known. A batch: the count per size.
 */
export default function OrderMeasurementsStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  return (
    <div className="space-y-7">
      <StepIntro title="Sizing" text={o.measurementsNeeded ? 'What you are ordering comes first, then how the shop gets your sizes.' : 'Choose the order mode.'} />

      <OrderOptionPicker o={o} />

      {(o.pricing.length <= 1 || o.pricingId !== null) && (<>
      <fieldset className="space-y-2.5">
        <SectionLabel as="legend">Order mode</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Order mode">
          <ModeCard on={o.orderMode === 'individual'} onClick={() => o.setOrderMode('individual')} Icon={User} title="Individual order" text="Made for one person." />
          <ModeCard on={o.orderMode === 'bulk'} onClick={() => o.setOrderMode('bulk')} Icon={Users} title="Bulk order" text={o.soldAsSet ? 'A batch of sets, counted by size, for a team or office.' : 'A batch counted by size, for a team or office.'} />
        </div>
      </fieldset>

      {!o.measurementsNeeded ? (
        <>
          <p className="text-sm text-ink-body bg-surface border border-line px-4 py-3">{measurementCopy(o.requirements)}</p>
          {o.orderMode === 'bulk' && <OrderBulkSizes o={o} />}
        </>
      ) : (
        <>
          <fieldset className="space-y-2.5">
            <SectionLabel as="legend">{COVERS_FIELD}</SectionLabel>
            {o.areaLocked ? (
              <p className="text-sm text-ink-body bg-surface border border-line px-4 py-3">{AREAS.find((a) => a.value === o.area)?.label}, set by the option you chose.</p>
            ) : (
              <>
                <Segmented square label={COVERS_FIELD} value={o.area as Exclude<OrderArea, ''>} onChange={o.setArea} options={AREAS} hint={AREAS.find((a) => a.value === o.area)?.hint} />
                {!o.area && <p className="mobile-caption text-ink-muted">Choose Top, Bottom or Top &amp; Bottom to go on.</p>}
              </>
            )}
          </fieldset>
          {o.area && (o.orderMode === 'individual' ? <IndividualSizing o={o} /> : <OrderBulkSizes o={o} />)}
        </>
      )}
      </>)}
    </div>
  );
}
