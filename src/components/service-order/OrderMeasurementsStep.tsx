'use client';

import { ImagePlus, Loader2, ShoppingBag, User, Users, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { ServiceOrderState } from './useServiceOrder';
import { FIELD, StepIntro, measurementCopy } from './orderUi';
import { GARMENT_TYPE_OPTIONS } from '@/components/jobs/jobHelpers';
import { ServiceChartBlock, hasServiceChart } from '@/components/store-service-detail/ServiceDetailBlocks';
import {
  PeopleList,
  PersonEditor,
  SizingFields,
  UnsavedDraftNote,
  droppedMeasurementCount,
  peopleBreakdown,
} from '@/components/order-people/PeopleEditor';

// Photos of a handwritten measurement list.
function SheetPhotos({ o }: Readonly<{ o: ServiceOrderState }>) {
  return (
    <div className="space-y-2">
      <p className="mobile-caption font-semibold text-ink-body">
        Or a photo of your measurement list <span className="text-ink-faint font-normal">(Optional)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {o.sheets.map((url) => (
          <div key={url} className="relative w-20 h-20 rounded-lg border border-line overflow-hidden bg-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getMediaUrl(url)} alt="Measurement list" className="w-full h-full object-cover" />
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
        <Icon size={18} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block mobile-caption text-ink-muted mt-0.5">{text}</span>
      </span>
    </button>
  );
}

// Step 2 — Measurements. Individual: one form for the customer's own sizing.
// Bulk: save each person (body measurements, a standard size, or measured at
// the shop) to a list, one piece per person.
export default function OrderMeasurementsStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  const bulk = o.orderMode === 'bulk';
  const total = o.persons.length;
  const belowMin = bulk && o.minQty > 1 && total < o.minQty;
  const dropped = bulk ? droppedMeasurementCount(o.persons, o.garmentType) : 0;
  const savedProfiles = o.savedMeasurements.map((m) => ({ id: m.id, label: `${m.profile_name} · version ${m.version}` }));
  const chart = o.service && hasServiceChart(o.service) ? <ServiceChartBlock service={o.service} /> : undefined;

  let totalNote: string;
  if (belowMin) totalNote = `This shop's minimum is ${o.minQty} pieces. Add ${o.minQty - total} more.`;
  else if (total === 0) totalNote = 'Add at least 1 person to continue.';
  else totalNote = `${peopleBreakdown(o.persons)} · one piece each`;

  return (
    <div className="space-y-5">
      <StepIntro
        title="Measurements"
        text={bulk ? "Fill out each person's size or body measurements and add them to the list." : 'Choose how the shop gets your size.'}
      />

      <fieldset className="space-y-2.5">
        <legend className="mobile-h4 text-ink mb-2.5">Order mode</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Order mode">
          <ModeCard on={!bulk} onClick={() => o.setOrderMode('individual')} Icon={User} title="Individual order" text="Made for one person." />
          <ModeCard on={bulk} onClick={() => o.setOrderMode('bulk')} Icon={Users} title="Bulk order" text="For a team, school or office: one piece per person." />
        </div>
      </fieldset>

      {!o.measurementsNeeded && (
        <p className="text-sm text-ink-body bg-surface border border-line rounded-lg px-4 py-3">
          {measurementCopy(o.requirements)}{bulk ? ' You can still list who the order is for.' : ''}
        </p>
      )}

      {/* One garment type for the whole order: it decides which measurements are asked for. */}
      <div className="space-y-1.5">
        <label htmlFor="order-garment-type" className="block text-sm font-semibold text-ink">
          Garment type <span className="text-ink-faint font-normal">(Optional)</span>
        </label>
        <select id="order-garment-type" value={o.garmentType} onChange={(e) => o.setGarmentType(e.target.value)} className={FIELD}>
          <option value="">Not sure / show all measurements</option>
          {GARMENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="mobile-caption text-ink-muted">
          {GARMENT_TYPE_OPTIONS.find((g) => g.value === o.garmentType)?.examples
            ?? 'Pick what you are ordering so we only ask the measurements it needs.'}
        </p>
        {dropped > 0 && (
          <p role="status" className="mobile-caption text-danger">
            {dropped === 1 ? '1 saved person has' : `${dropped} saved people have`} measurements this garment type doesn&apos;t use. Those won&apos;t be sent.
          </p>
        )}
      </div>

      {!bulk && o.measurementsNeeded && (
        <section aria-label="Your size" className="bg-surface border border-line rounded-lg p-4 space-y-4">
          <SizingFields
            people={o.solo}
            sizes={o.bulkSizes}
            garmentType={o.garmentType}
            savedProfiles={savedProfiles}
            onPickProfile={o.fillDraftFromProfile}
            chart={chart}
            shopNote="The shop sets a fitting visit to measure you after accepting your order."
          />
        </section>
      )}

      {bulk && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="order-team" className="block text-sm font-semibold text-ink">
              Team / organization name <span className="text-ink-faint font-normal">(Optional)</span>
            </label>
            <input
              id="order-team"
              type="text"
              maxLength={255}
              value={o.teamName}
              onChange={(e) => o.setTeamName(e.target.value)}
              placeholder="e.g. ABC Corp. Admin Dept., San Antonio Youth Basketball"
              className={FIELD}
            />
          </div>

          <PeopleList people={o.people} garmentType={o.garmentType} />

          <PersonEditor
            people={o.people}
            sizes={o.bulkSizes}
            garmentType={o.garmentType}
            savedProfiles={savedProfiles}
            onPickProfile={o.fillDraftFromProfile}
            chart={chart}
          />

          <UnsavedDraftNote people={o.people} />
        </>
      )}

      {(bulk || o.measurementsNeeded) && <SheetPhotos o={o} />}

      {bulk && (
        <div className="bg-surface border border-line rounded-lg p-4 flex items-center gap-3">
          <span className="w-9 h-9 shrink-0 rounded-lg bg-canvas text-taupe flex items-center justify-center">
            <ShoppingBag size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink tabular-nums">
              {total} {total === 1 ? 'piece' : 'pieces'} on the list
            </p>
            <p className={`mobile-caption ${belowMin ? 'text-danger' : 'text-ink-muted'}`}>{totalNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
