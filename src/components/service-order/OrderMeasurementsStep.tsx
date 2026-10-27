'use client';

import { ImagePlus, Loader2, User, Users, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { BULK_SIZES, type IndividualMeasurements, type ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, SectionLabel, StepIntro, measurementCopy } from './orderUi';

const FIELDS: { key: Exclude<keyof IndividualMeasurements, 'unit'>; label: string; hint: string; optional?: boolean }[] = [
  { key: 'chest', label: 'Chest / Bust', hint: '38' },
  { key: 'waist', label: 'Waist', hint: '32' },
  { key: 'hips', label: 'Hips', hint: '40' },
  { key: 'shoulders', label: 'Shoulders', hint: '17.5' },
  { key: 'length', label: 'Garment length', hint: '29' },
  { key: 'neck', label: 'Neck', hint: '15.5', optional: true },
  { key: 'sleeve', label: 'Sleeve', hint: '24', optional: true },
  { key: 'inseam', label: 'Inseam / Outseam', hint: '31', optional: true },
];

const INPUT = 'w-full h-[48px] bg-canvas border border-line rounded-none px-3 text-base text-ink tabular-nums focus:outline-none focus:border-taupe placeholder:text-ink-faint';

function ModeCard({ on, onClick, Icon, title, text }: Readonly<{ on: boolean; onClick: () => void; Icon: typeof User; title: string; text: string }>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`p-3.5 border text-left transition-colors flex items-start gap-3 ${
        on ? 'border-taupe bg-taupe/5 ring-2 ring-taupe/20' : 'border-line bg-surface hover:border-taupe/40'
      }`}
    >
      <span className={`w-9 h-9 flex items-center justify-center shrink-0 ${on ? 'bg-taupe text-white' : 'bg-canvas text-ink-muted'}`}>
        <Icon size={18} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block mobile-caption text-ink-muted mt-0.5">{text}</span>
      </span>
    </button>
  );
}

// Step 2 — Measurements, same choices as the walk-in form: one person's body
// measurements, or a bulk batch counted by size.
export default function OrderMeasurementsStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  const setField = (key: keyof IndividualMeasurements, value: string) =>
    o.setMeasurements((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-7">
      <StepIntro title="Measurements" text="Choose the order mode, then how the shop gets your sizes." />

      <fieldset className="space-y-2.5">
        <SectionLabel as="legend">Order mode</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Order mode">
          <ModeCard on={o.orderMode === 'individual'} onClick={() => o.setOrderMode('individual')} Icon={User} title="Individual order" text="Made for one person's body measurements." />
          <ModeCard on={o.orderMode === 'bulk'} onClick={() => o.setOrderMode('bulk')} Icon={Users} title="Bulk order" text="A batch counted by size, for a team or office." />
        </div>
      </fieldset>

      {o.orderMode === 'individual' && !o.measurementsNeeded && (
        <p className="text-sm text-ink-body bg-surface border border-line px-4 py-3">{measurementCopy(o.requirements)}</p>
      )}

      {o.orderMode === 'individual' && o.measurementsNeeded && (
        <div className="space-y-5">
          <fieldset className="space-y-2.5">
            <SectionLabel as="legend">Your measurements</SectionLabel>
            <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Measurement source">
              {o.savedMeasurements.length > 0 && (
                <ChoiceCard selected={o.measurementSource === 'saved'} onSelect={() => o.setMeasurementSource('saved')} label="Use measurements on file" detail="This shop already measured you." />
              )}
              <ChoiceCard selected={o.measurementSource === 'own'} onSelect={() => o.setMeasurementSource('own')} label="Enter my measurements" detail="Type them in or attach a photo of your measurement card." />
              <ChoiceCard selected={o.measurementSource === 'shop'} onSelect={() => o.setMeasurementSource('shop')} label="Have the shop measure me" detail="The shop sets a fitting visit after accepting your order." />
            </div>
          </fieldset>

          {o.measurementSource === 'saved' && o.savedMeasurements.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="order-profile" className="mobile-caption font-semibold text-ink-body block">Measurement profile</label>
              <select
                id="order-profile"
                value={o.measurementId ?? ''}
                onChange={(e) => o.setMeasurementId(e.target.value ? Number(e.target.value) : null)}
                className={INPUT}
              >
                {o.savedMeasurements.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.profile_name} · version {m.version}
                  </option>
                ))}
              </select>
            </div>
          )}

          {o.measurementSource === 'own' && (
            <div className="space-y-4 bg-surface border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">Body measurements</p>
                <div className="flex border border-line" role="radiogroup" aria-label="Unit">
                  {(['in', 'cm'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      role="radio"
                      aria-checked={o.measurements.unit === u}
                      onClick={() => setField('unit', u)}
                      className={`h-9 px-3 text-xs font-semibold transition-colors ${o.measurements.unit === u ? 'bg-taupe text-white' : 'text-ink-muted hover:text-ink'}`}
                    >
                      {u === 'in' ? 'Inches' : 'Centimeters'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FIELDS.map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`m-${f.key}`} className={`block mobile-caption mb-1 ${f.optional ? 'text-ink-muted' : 'font-semibold text-ink-body'}`}>
                      {f.label}{f.optional && ' (optional)'}
                    </label>
                    <input
                      id={`m-${f.key}`}
                      type="number"
                      inputMode="decimal"
                      step="0.25"
                      min="0"
                      value={o.measurements[f.key]}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.hint}
                      className={INPUT}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="mobile-caption font-semibold text-ink-body">Measurement card photo <span className="text-ink-faint font-normal">(optional)</span></p>
                <div className="flex flex-wrap gap-2">
                  {o.sheets.map((url) => (
                    <div key={url} className="relative w-20 h-20 border border-line overflow-hidden bg-sunken">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getMediaUrl(url)} alt="Measurement card" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => o.setSheets((p) => p.filter((u) => u !== url))} aria-label="Remove photo" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink/75 text-white flex items-center justify-center">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {o.sheets.length < o.maxPhotos && (
                    <label className="w-20 h-20 border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 text-ink-faint cursor-pointer hover:border-taupe/50 hover:text-taupe transition-colors focus-within:border-taupe">
                      {o.uploadingSheet ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                      <span className="text-[11px] font-medium">{o.uploadingSheet ? 'Uploading' : 'Add'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={o.uploadingSheet}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void o.uploadSheet(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <p className="mobile-caption text-ink-muted">The shop checks these at your fitting before cutting.</p>
            </div>
          )}
        </div>
      )}

      {o.orderMode === 'bulk' && (
        <div className="space-y-5">
          <div className="space-y-2.5">
            <SectionLabel htmlFor="order-team">
              Team / organization name <span className="text-ink-faint font-normal">(Optional)</span>
            </SectionLabel>
            <input
              id="order-team"
              type="text"
              maxLength={255}
              value={o.teamName}
              onChange={(e) => o.setTeamName(e.target.value)}
              placeholder="e.g. Barangay San Antonio Youth Basketball"
              className={INPUT.replace('px-3', 'px-4')}
            />
          </div>
          <div className="space-y-2.5">
            <SectionLabel as="p">Pieces per size</SectionLabel>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {BULK_SIZES.map((s) => (
                <div key={s}>
                  <label htmlFor={`size-${s}`} className="block text-center text-xs font-semibold text-ink-body mb-1">{s}</label>
                  <input
                    id={`size-${s}`}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="500"
                    value={o.sizeBreakdown[s] ?? ''}
                    onChange={(e) => o.setSizeBreakdown((prev) => ({ ...prev, [s]: e.target.value.replace(/\D/g, '') }))}
                    placeholder="0"
                    className={`${INPUT} text-center px-1`}
                  />
                </div>
              ))}
            </div>
            <p className={`text-sm tabular-nums ${o.bulkPieces > 0 && o.bulkPieces < o.minQty ? 'text-danger' : 'text-ink-muted'}`}>
              {o.bulkPieces} {o.bulkPieces === 1 ? 'piece' : 'pieces'} total
              {o.minQty > 1 && ` · this shop's minimum is ${o.minQty}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
