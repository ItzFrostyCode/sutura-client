'use client';

import { useState } from 'react';
import { Check, ClipboardList, Plus } from 'lucide-react';
import type { ServiceOrderState } from './useServiceOrder';
import { CUSTOM_FIT, rowArea } from './useOrderForm';
import { INPUT, SectionLabel, Segments, TEXTAREA } from './orderUi';
import OrderRosterRow from './OrderRosterRow';
import OrderGetsSelect from './OrderGetsSelect';
import OrderMeasureSection from './OrderMeasureSection';
import OrderUnitPicker from './OrderUnitPicker';
import { sizesOf } from './OrderSizeChart';
import { tally } from './orderQuestions';

/** A Group order: the team's name, one row per person (starting at the shop's minimum), and the size counts. */
export default function OrderGroupRoster({ o }: Readonly<{ o: ServiceOrderState }>) {
  const { f } = o;
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const sizes = sizesOf(o.service);
  const sized = o.sizesNeeded;
  const named = f.roster.filter((r) => r.name.trim()).length;
  const enough = f.roster.length >= o.groupMin && named === f.roster.length;
  const anyCustom = f.roster.some((r) => r.size === CUSTOM_FIT || r.bottomSize === CUSTOM_FIT);
  const areaOf = (r: (typeof f.roster)[number]) => rowArea(r, o.area, o.areaLocked);
  const topTally = tally(f.roster.filter((r) => areaOf(r) !== 'bottom').map((r) => r.size));
  const bottomTally = tally(f.roster.flatMap((r) => (areaOf(r) === 'both' ? [r.bottomSize] : areaOf(r) === 'bottom' ? [r.size] : [])));

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel htmlFor="order-team" hint="The name of the order on the shop's work ticket.">Team or group name</SectionLabel>
        <input id="order-team" type="text" maxLength={255} value={f.teamName} onChange={(e) => f.setTeamName(e.target.value)} placeholder="e.g. Grade 10 – Rizal" className={INPUT} />
      </div>

      {sized && anyCustom && o.chartSizes && <OrderUnitPicker f={f} />}

      {o.hasChart && (
        <fieldset>
          <SectionLabel as="legend" hint="Use the shop's chart sizes, or type each person's measurements instead.">How to size everyone</SectionLabel>
          <Segments label="How to size everyone" value={f.groupSizing} onChange={f.setGroupSizing}
            options={[{ value: 'standard', label: 'Standard sizes' }, { value: 'measure', label: 'Measurements' }]} />
        </fieldset>
      )}

      <section aria-labelledby="roster-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 id="roster-title" className="mobile-h4 text-ink">People and their sizes</h3>
          <p className={`flex items-center gap-1 text-sm tabular-nums ${enough ? 'text-emerald-700' : 'text-ink-muted'}`}>
            {enough && <Check size={16} aria-hidden />}{named} of {f.roster.length} named · minimum {o.groupMin}
          </p>
        </div>
        <p className="mobile-body-sm mb-3 text-ink-muted">
          {o.chartSizes
            ? <>Type each person&apos;s name, then choose their size{!o.areaLocked ? '. Each person can get a top, a bottom or a full set' : ''}.</>
            : <>Type each person&apos;s name and their measurements{!o.areaLocked ? '. Under Gets, choose a set, a top or a bottom' : ''}.</>}
        </p>
        {/* No size chart from the shop: each person's measurements in a table. With a chart: each person's chart size. */}
        {!o.chartSizes ? <OrderMeasureSection o={o} /> : (
          <ol className="space-y-3">
            {f.roster.map((r, i) => (
              <OrderRosterRow key={r.id} row={r} index={i} area={areaOf(r)} partChoosable={!o.areaLocked}
                gets={o.perPerson ? <OrderGetsSelect o={o} row={r} prefix="Gets: " className="h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-base text-ink focus:border-ink focus:outline-none" /> : undefined} columns={o.rosterColumns}
                sizes={sizes} unit={f.unit} sized={sized} allowCustom={o.measurementsNeeded}
                canRemove={f.roster.length > o.groupMin} onChange={(patch) => f.updateRow(r.id, patch)} onRemove={() => f.removeRow(r.id)} />
            ))}
          </ol>
        )}

        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={() => f.addPeople(1)} className="flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:border-ink">
            <Plus size={16} aria-hidden /> Add a person
          </button>
          <button type="button" onClick={() => setPasting((v) => !v)} aria-expanded={pasting} className="flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:border-ink">
            <ClipboardList size={16} aria-hidden /> Paste a list of names
          </button>
        </div>
        {pasting && (
          <div className="mt-3 space-y-3">
            <label htmlFor="order-paste" className="mobile-body-sm block text-ink-muted">One name per line. They fill the empty rows first; extra names add rows.</label>
            <textarea id="order-paste" rows={5} value={pasteText} onChange={(e) => setPasteText(e.target.value)} className={TEXTAREA} placeholder={'Juan Dela Cruz\nMaria Santos'} />
            <button type="button" disabled={!pasteText.trim()} onClick={() => { f.pasteNames(pasteText); setPasteText(''); setPasting(false); }}
              className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40">Add these names</button>
          </div>
        )}
      </section>

      {sized && o.chartSizes && (topTally || bottomTally) && (
        <div className="rounded-2xl bg-sunken p-4">
          <p className="mobile-h4 text-ink">Size count</p>
          {topTally && <p className="mobile-body-sm mt-1 break-words text-ink-body">{bottomTally ? `Tops: ${topTally}` : topTally}</p>}
          {bottomTally && <p className="mobile-body-sm break-words text-ink-body">Bottoms: {bottomTally}</p>}
        </div>
      )}
    </div>
  );
}
