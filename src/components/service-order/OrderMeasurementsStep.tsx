'use client';

import { useState } from 'react';
import { ChevronDown, ImagePlus, Loader2, Plus, Ruler, Trash2, User, Users, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { IndividualMeasurements, ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, Em, FIELD, FitTip, SectionLabel, StepIntro, measurementCopy } from './orderUi';
import { GARMENT_TYPE_OPTIONS } from '@/components/jobs/jobHelpers';
import { measurementFieldsFor } from '@/lib/garmentMeasurements';
import { ServiceChartBlock, hasServiceChart } from '@/components/store-service-detail/ServiceDetailBlocks';

const INPUT = `${FIELD.replace('px-4', 'px-3')} tabular-nums`;

function UnitToggle({ unit, onChange, label }: Readonly<{ unit: 'in' | 'cm'; onChange: (u: 'in' | 'cm') => void; label: string }>) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-line shrink-0" role="radiogroup" aria-label={label}>
      {(['in', 'cm'] as const).map((u) => (
        <button
          key={u}
          type="button"
          role="radio"
          aria-checked={unit === u}
          onClick={() => onChange(u)}
          className={`h-9 px-3 text-xs font-semibold transition-colors ${unit === u ? 'bg-taupe text-white' : 'text-ink-muted hover:text-ink'}`}
        >
          {u === 'in' ? 'Inches' : 'Centimeters'}
        </button>
      ))}
    </div>
  );
}

// Photos of a handwritten measurement card / sheet (used by both order modes).
function SheetPhotos({ o, label }: Readonly<{ o: ServiceOrderState; label: string }>) {
  return (
    <div className="space-y-2">
      <p className="mobile-caption font-semibold text-ink-body">{label} <span className="text-ink-faint font-normal">(optional)</span></p>
      <div className="flex flex-wrap gap-2">
        {o.sheets.map((url) => (
          <div key={url} className="relative w-20 h-20 rounded-lg border border-line overflow-hidden bg-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getMediaUrl(url)} alt="Measurement card" className="w-full h-full object-cover" />
            <button type="button" onClick={() => o.setSheets((p) => p.filter((u) => u !== url))} aria-label="Remove photo" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink/75 text-white flex items-center justify-center">
              <X size={12} />
            </button>
          </div>
        ))}
        {o.sheets.length < o.maxPhotos && (
          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 text-ink-faint cursor-pointer hover:border-taupe/50 hover:text-taupe transition-colors focus-within:border-taupe">
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
  );
}

function ModeCard({ on, onClick, Icon, title, text }: Readonly<{ on: boolean; onClick: () => void; Icon: typeof User; title: string; text: string }>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`p-3.5 rounded-lg border text-left transition-colors flex items-start gap-3 ${
        on ? 'border-taupe bg-taupe/10 shadow-sm' : 'border-line bg-surface hover:border-taupe/40'
      }`}
    >
      <span className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${on ? 'bg-taupe text-white' : 'bg-canvas text-ink-muted'}`}>
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
  // Only the measurements this Garment Type needs (all of them until one is picked).
  const fields = measurementFieldsFor(o.garmentType);

  // Person cards fold into a one-line summary so a long list stays short.
  // Adding someone folds everyone before them; the new card opens.
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggle = (id: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const addPerson = () => {
    setCollapsed(new Set(o.members.map((m) => m.id)));
    o.addMember();
  };
  const allCollapsed = o.members.length > 0 && o.members.every((m) => collapsed.has(m.id));
  const summary = (m: ServiceOrderState['members'][number]) => {
    const filled = fields.filter((f) => m.values[f.key].trim() !== '').length;
    return [m.size || 'Size not set', filled > 0 ? `${filled} measurement${filled === 1 ? '' : 's'}` : 'No measurements yet'].join(' · ');
  };

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

      {o.orderMode === 'individual' && (
        <div className="space-y-2.5">
          <SectionLabel htmlFor="order-garment-type">
            Garment type <span className="text-ink-faint font-normal">(Optional)</span>
          </SectionLabel>
          <select
            id="order-garment-type"
            value={o.garmentType}
            onChange={(e) => o.setGarmentType(e.target.value)}
            className={INPUT}
          >
            <option value="">Not sure / show all measurements</option>
            {GARMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="mobile-caption text-ink-muted">
            {GARMENT_TYPE_OPTIONS.find((g) => g.value === o.garmentType)?.examples
              ?? 'Pick what you are ordering so we only ask the measurements it needs.'}
          </p>
        </div>
      )}

      {o.orderMode === 'individual' && !o.measurementsNeeded && (
        <p className="text-sm text-ink-body bg-surface border border-line rounded-lg px-4 py-3">{measurementCopy(o.requirements)}</p>
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
            <div className="space-y-4 bg-surface border border-line rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">Body measurements</p>
                <UnitToggle unit={o.measurements.unit} onChange={(u) => setField('unit', u)} label="Unit" />
              </div>
              <FitTip title="Measurement Tip">
                {o.measurements.unit === 'cm' ? (
                  <>To ensure a comfortable fit, <Em>add 7.5 cm</Em> (3 inches) to your actual body measurements. (Example: If your chest measures 97 cm, please enter 104.5.)</>
                ) : (
                  <>To ensure a comfortable fit, <Em>add 3 inches</Em> to your actual body measurements. (Example: If your chest measures 38 inches, please enter 41.)</>
                )}
              </FitTip>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`m-${f.key}`} className="block mobile-caption mb-1 font-semibold text-ink-body">
                      {f.label}
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
              <SheetPhotos o={o} label="Measurement card photo" />
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
            <FitTip title="Sizing Guide">
              For the best fit, please order <Em>one size larger</Em> than your usual size. (Example: If you usually wear Medium (M), choose Large (L).)
            </FitTip>
            {o.service && hasServiceChart(o.service) && (
              <div className="space-y-2 bg-surface border border-line rounded-lg p-4">
                <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                  <Ruler size={15} className="text-taupe" aria-hidden="true" /> This shop&apos;s size chart
                </p>
                <p className="mobile-caption text-ink-muted -mt-1">Match each person to a size below.</p>
                <ServiceChartBlock service={o.service} />
              </div>
            )}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {o.bulkSizes.map((s) => (
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

          {/* Optional: each person's own body measurements. */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionLabel as="p">
                  Body measurements per person <span className="text-ink-faint font-normal">(Optional)</span>
                </SectionLabel>
                <p className="mobile-caption text-ink-muted mt-0.5">Add anyone whose exact measurements you already have. The rest go by size.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {o.members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(o.members.map((m) => m.id)))}
                    className="h-9 px-3 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink"
                  >
                    {allCollapsed ? 'Expand all' : 'Collapse all'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={addPerson}
                  disabled={o.members.length >= o.maxMembers}
                  className="h-9 px-3 rounded-lg border border-line bg-surface text-ink text-xs font-semibold flex items-center gap-1 hover:border-taupe/50 disabled:opacity-50"
                >
                  <Plus size={14} aria-hidden="true" /> Add person
                </button>
              </div>
            </div>

            {o.members.length > 0 && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="bulk-garment-type" className="mobile-caption font-semibold text-ink-body block">Garment type</label>
                  <select id="bulk-garment-type" value={o.garmentType} onChange={(e) => o.setGarmentType(e.target.value)} className={INPUT}>
                    <option value="">Not sure / show all measurements</option>
                    {GARMENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <FitTip title="Measurement Tip">
                  To ensure a comfortable fit, <Em>add 3 inches</Em> (7.5 cm) to each actual body measurement.
                </FitTip>
              </>
            )}

            {o.members.map((m, idx) => {
              const isOpen = !collapsed.has(m.id);
              return (
              <div key={m.id} className={`bg-surface border border-line rounded-lg ${isOpen ? 'p-4 space-y-3' : 'px-4 py-2'}`}>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    aria-expanded={isOpen}
                    aria-controls={`member-body-${m.id}`}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-ink-muted transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {m.name.trim() || `Person ${idx + 1}`}
                      </span>
                      {!isOpen && <span className="block truncate mobile-caption text-ink-muted">{summary(m)}</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => o.removeMember(m.id)}
                    aria-label={`Remove ${m.name.trim() || `person ${idx + 1}`}`}
                    className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-ink-muted hover:text-danger hover:bg-danger/5"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {isOpen && (
                <div id={`member-body-${m.id}`} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem] gap-3">
                  <div>
                    <label htmlFor={`member-name-${m.id}`} className="block mobile-caption mb-1 font-semibold text-ink-body">Name</label>
                    <input
                      id={`member-name-${m.id}`}
                      type="text"
                      maxLength={100}
                      value={m.name}
                      onChange={(e) => o.updateMember(m.id, { name: e.target.value })}
                      placeholder="e.g. Juan Dela Cruz"
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label htmlFor={`member-size-${m.id}`} className="block mobile-caption mb-1 font-semibold text-ink-body">Size</label>
                    <select
                      id={`member-size-${m.id}`}
                      value={m.size}
                      onChange={(e) => o.updateMember(m.id, { size: e.target.value })}
                      className={INPUT}
                    >
                      <option value="">Not sure</option>
                      {o.bulkSizes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="mobile-caption font-semibold text-ink-body">Measurements</p>
                  <UnitToggle
                    unit={m.values.unit}
                    onChange={(u) => o.updateMember(m.id, { values: { ...m.values, unit: u } })}
                    label={`Unit for person ${idx + 1}`}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {fields.map((f) => (
                    <div key={f.key}>
                      <label htmlFor={`member-${m.id}-${f.key}`} className="block mobile-caption mb-1 font-semibold text-ink-body">{f.label}</label>
                      <input
                        id={`member-${m.id}-${f.key}`}
                        type="number"
                        inputMode="decimal"
                        step="0.25"
                        min="0"
                        value={m.values[f.key]}
                        onChange={(e) => o.updateMember(m.id, { values: { ...m.values, [f.key]: e.target.value } })}
                        placeholder={f.hint}
                        className={INPUT}
                      />
                    </div>
                  ))}
                </div>
                </div>
                )}
              </div>
              );
            })}

            {o.members.length > 1 && (
              <button
                type="button"
                onClick={addPerson}
                disabled={o.members.length >= o.maxMembers}
                className="w-full h-11 rounded-lg border border-dashed border-line text-sm font-semibold text-ink-muted flex items-center justify-center gap-1.5 hover:border-taupe/50 hover:text-taupe disabled:opacity-50"
              >
                <Plus size={15} aria-hidden="true" /> Add another person
              </button>
            )}

            <SheetPhotos o={o} label="Or a photo of your measurement list" />
          </div>
        </div>
      )}
    </div>
  );
}
