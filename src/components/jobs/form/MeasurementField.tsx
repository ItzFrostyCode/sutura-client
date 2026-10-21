'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, FileText, Plus, Ruler, Shirt, Clock } from 'lucide-react';
import SavedProfileList from './SavedProfileList';
import { FIELD, LABEL, Chip } from './FormStep';
import type { CustomerMeasurement, MeasurementSourceMode, InlineMeasurementData } from './types';
import RadioRows from '@/components/shared/RadioRows';
import { unitOfMetrics, type MeasureUnit } from '@/lib/measurementUnit';
import { BTN_SM } from '@/components/shared/plainForm';
import SubjectProfileBar from '@/components/measurements/recorder/SubjectProfileBar';
import AreaSelector, {
  type MeasurementAreaChoice,
} from '@/components/measurements/recorder/AreaSelector';
import AreaGrid from '@/components/measurements/recorder/AreaGrid';
import PaperSheets from '@/components/measurements/recorder/PaperSheets';
import { confirmDialog } from '@/store/useConfirmStore';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

interface Props {
  readonly customerId: string;
  readonly customerName?: string;
  readonly storeId?: number;
  readonly targetTitle?: string;
  /** The styles the service offers (polo, V-neck…); each person gets one. */
  readonly styleOptions?: string[];
  /** The shop's own unit: used until someone picks another while measuring. */
  readonly defaultUnit?: MeasureUnit;
  readonly appointmentId?: string | null;
  readonly measurements: CustomerMeasurement[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly standardSize: string;
  readonly onStandardSize: (size: string) => void;
  readonly measurementMode: MeasurementSourceMode;
  readonly onMeasurementModeChange: (mode: MeasurementSourceMode) => void;
  readonly inlineMeasurement: InlineMeasurementData;
  readonly onInlineMeasurementChange: React.Dispatch<React.SetStateAction<InlineMeasurementData>>;
  readonly persons?: InlineMeasurementData[];
  readonly activePersonIndex?: number;
  readonly onSelectPerson?: (idx: number) => void;
  readonly onAddPerson?: () => void;
  readonly onRemovePerson?: (idx: number) => void;
  readonly onUpdatePerson?: (
    idx: number,
    updater: (prev: InlineMeasurementData) => InlineMeasurementData
  ) => void;
}

/**
 * High-efficiency in-flow tailoring measurement recorder for Create Job Order.
 * Lets tailors record measurements right now at the counter (Top, Bottom, Top & Bottom,
 * with paper sheet photos), select an existing customer profile, or pick a standard size.
 * Supports multiple people (e.g. entourage, couple, group) with custom Top & Bottom grids!
 */
export default function MeasurementField({
  customerId,
  customerName = 'Customer',
  styleOptions,
  defaultUnit = 'in',
  storeId,
  appointmentId,
  measurements,
  selectedId,
  onSelect,
  standardSize,
  onStandardSize,
  measurementMode,
  onMeasurementModeChange,
  inlineMeasurement,
  onInlineMeasurementChange,
  persons,
  activePersonIndex = 0,
  onSelectPerson,
  onAddPerson,
  onRemovePerson,
  onUpdatePerson,
}: Props) {
  if (!customerId) {
    return <p className="text-sm text-ink-faint">Choose the customer first to record or link measurements.</p>;
  }

  const effectivePersons = persons && persons.length > 0 ? persons : [inlineMeasurement];
  const activeIdx = Math.max(0, Math.min(activePersonIndex, effectivePersons.length - 1));
  const currentPerson = effectivePersons[activeIdx] || inlineMeasurement;

  const updateCurrentPerson = (updater: (prev: InlineMeasurementData) => InlineMeasurementData) => {
    if (onUpdatePerson && persons) {
      onUpdatePerson(activeIdx, updater);
    } else {
      onInlineMeasurementChange(updater);
    }
  };

  const unit: MeasureUnit = currentPerson.metrics?._unit ? unitOfMetrics(currentPerson.metrics) : defaultUnit;
  const setUnit = (u: MeasureUnit) => {
    // One unit for everyone measured here, so a group is never half inches and half centimeters.
    const apply = (prev: InlineMeasurementData): InlineMeasurementData => ({ ...prev, metrics: { ...prev.metrics, _unit: u } });
    if (onUpdatePerson && persons) persons.forEach((_, i) => onUpdatePerson(i, apply));
    else onInlineMeasurementChange(apply);
  };
  const copyFromPrevious = async () => {
    const before = effectivePersons[activeIdx - 1];
    if (!before) return;
    const typed = Object.entries(currentPerson.metrics ?? {}).some(([k, v]) => !k.startsWith('_') && String(v).trim() !== '');
    if (typed && !(await confirmDialog({ title: 'Replace these measurements?', message: 'What you typed for this person is replaced with the previous person’s measurements.', confirmLabel: 'Replace' }))) return;
    updateCurrentPerson((prev) => ({
      ...prev, measurement_area: before.measurement_area, top_columns: [...before.top_columns], bottom_columns: [...before.bottom_columns],
      metrics: { ...before.metrics },
    }));
  };

  const activeProfileName = currentPerson.profile_name || (activeIdx === 0 ? `${customerName}'s Profile` : `Person ${activeIdx + 1}`);

  const handleMetricChange = (metricKey: string, value: string) => {
    updateCurrentPerson((prev) => ({
      ...prev,
      metrics: { ...prev.metrics, [metricKey]: value },
    }));
  };

  const handleAddTopColumn = (newCol: string) => {
    updateCurrentPerson((prev) => {
      if (prev.top_columns.map((c) => c.toLowerCase()).includes(newCol.toLowerCase())) return prev;
      return { ...prev, top_columns: [...prev.top_columns, newCol] };
    });
  };

  const handleRemoveTopColumn = (colToRemove: string) => {
    updateCurrentPerson((prev) => ({
      ...prev,
      top_columns: prev.top_columns.filter((c) => c !== colToRemove),
    }));
  };

  const handleRenameTopColumn = (oldName: string, newName: string) => {
    updateCurrentPerson((prev) => {
      const updatedCols = prev.top_columns.map((c) => (c === oldName ? newName : c));
      const updatedMetrics = { ...prev.metrics };
      if (updatedMetrics[oldName] !== undefined) {
        updatedMetrics[newName] = updatedMetrics[oldName];
        delete updatedMetrics[oldName];
      }
      return { ...prev, top_columns: updatedCols, metrics: updatedMetrics };
    });
  };

  const handleAddBottomColumn = (newCol: string) => {
    updateCurrentPerson((prev) => {
      if (prev.bottom_columns.map((c) => c.toLowerCase()).includes(newCol.toLowerCase())) return prev;
      return { ...prev, bottom_columns: [...prev.bottom_columns, newCol] };
    });
  };

  const handleRemoveBottomColumn = (colToRemove: string) => {
    updateCurrentPerson((prev) => ({
      ...prev,
      bottom_columns: prev.bottom_columns.filter((c) => c !== colToRemove),
    }));
  };

  const handleRenameBottomColumn = (oldName: string, newName: string) => {
    updateCurrentPerson((prev) => {
      const updatedCols = prev.bottom_columns.map((c) => (c === oldName ? newName : c));
      const updatedMetrics = { ...prev.metrics };
      if (updatedMetrics[oldName] !== undefined) {
        updatedMetrics[newName] = updatedMetrics[oldName];
        delete updatedMetrics[oldName];
      }
      return { ...prev, bottom_columns: updatedCols, metrics: updatedMetrics };
    });
  };

  const showTop = currentPerson.measurement_area === 'top' || currentPerson.measurement_area === 'both';
  const showBottom = currentPerson.measurement_area === 'bottom' || currentPerson.measurement_area === 'both';

  const profileBarData = effectivePersons.map((p, idx) => ({
    profile_name: p.profile_name,
    version: 1,
    isNew: true,
  }));

  return (
    <div className="space-y-4">
      {/* How the measurements come in: four clear choices, not a small switch */}
      <RadioRows
        label="How to get the measurements" value={measurementMode} onChange={onMeasurementModeChange}
        options={[
          { value: 'record_now', icon: <Ruler size={18} />, title: 'Take measurements now', hint: 'Measure the customer here' },
          ...(measurements.length > 0 ? [{ value: 'existing' as const, icon: <Sparkles size={18} />, title: 'Use saved measurements', hint: `${measurements.length} on file` }] : []),
          { value: 'standard_size', icon: <Shirt size={18} />, title: 'Standard size', hint: 'S, M, L, XL…' },
          { value: 'none', icon: <Clock size={18} />, title: 'Measure later', hint: 'Before the price is final' },
        ]}
      />

      {measurementMode === 'none' && (
        <div className="space-y-3 border-y border-espresso/15 py-3">
          <p className="text-sm text-espresso">The order is saved without measurements. It cannot be priced or started until they are recorded under Details and checked.</p>
          <button type="button" onClick={() => onMeasurementModeChange('record_now')} className={BTN_SM}>Measure now instead</button>
        </div>
      )}

      {/* MODE A: RECORD MEASUREMENTS INLINE RIGHT NOW */}
      {measurementMode === 'record_now' && (
        <div className="space-y-4">
          <div>
            <span className={LABEL}>Measured in</span>
            <div className="flex gap-2">
              <Chip active={unit === 'in'} onClick={() => setUnit('in')}>Inches</Chip>
              <Chip active={unit === 'cm'} onClick={() => setUnit('cm')}>Centimeters</Chip>
            </div>
          </div>

          {/* People Profile Bar (Person 1, Person 2, ... + Add Person) */}
          <SubjectProfileBar
            persons={profileBarData}
            activeIndex={activeIdx}
            onSelectIndex={(idx) => onSelectPerson && onSelectPerson(idx)}
            onAddPerson={() => onAddPerson && onAddPerson()}
            onRemovePerson={(idx) => onRemovePerson && onRemovePerson(idx)}
            onProfileNameChange={(newName) =>
              updateCurrentPerson((prev) => ({ ...prev, profile_name: newName }))
            }
            customerName={customerName}
            onCopyPrevious={copyFromPrevious}
            style={currentPerson.metrics?.Style ?? ''}
            onStyleChange={(v) => handleMetricChange('Style', v)}
            styleOptions={styleOptions}
          />

          {/* Area Selector (Top / Bottom / Top & Bottom) */}
          <AreaSelector
            personName={activeProfileName}
            selectedArea={currentPerson.measurement_area}
            onSelectArea={(area: MeasurementAreaChoice) =>
              updateCurrentPerson((prev) => ({
                ...prev,
                measurement_area: area,
              }))
            }
          />

          {/* Separate Top and Bottom Grids */}
          <div className="@container">
            <div className={`grid grid-cols-1 gap-8 ${showTop && showBottom ? '@[760px]:grid-cols-2 @[760px]:items-start' : ''}`}>
            {showTop && (
              <AreaGrid
                title="Top Measurements"
                icon="👔"
                area="top"
                unit={unit}
                columns={currentPerson.top_columns}
                metrics={currentPerson.metrics}
                onMetricChange={handleMetricChange}
                onAddColumn={handleAddTopColumn}
                onRemoveColumn={handleRemoveTopColumn}
                onRenameColumn={handleRenameTopColumn}
              />
            )}

            {showBottom && (
              <AreaGrid
                title="Bottom Measurements"
                icon="👖"
                area="bottom"
                unit={unit}
                columns={currentPerson.bottom_columns}
                metrics={currentPerson.metrics}
                onMetricChange={handleMetricChange}
                onAddColumn={handleAddBottomColumn}
                onRemoveColumn={handleRemoveBottomColumn}
                onRenameColumn={handleRenameBottomColumn}
              />
            )}
            </div>
          </div>

          {/* Paper Measurement Sheet Photos */}
          {storeId && (
            <PaperSheets
              photoUrls={currentPerson.photo_urls}
              onChangePhotos={(urls) =>
                updateCurrentPerson((prev) => ({ ...prev, photo_urls: urls }))
              }
              storeId={storeId}
            />
          )}

          <div>
            <label htmlFor="inline-fitter-notes" className={LABEL}>Fitter&apos;s notes <span className="font-normal text-espresso/60">(optional)</span></label>
            <textarea
              id="inline-fitter-notes" value={currentPerson.notes} rows={3}
              onChange={(e) => updateCurrentPerson((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Sloping right shoulder, prefers comfortable cuffs, 1 inch ease"
              className={`${FIELD} h-auto resize-y py-2`}
            />
          </div>

          <p className="text-sm text-espresso/60">{effectivePersons.length} {effectivePersons.length === 1 ? 'person' : 'people'} being measured.</p>
        </div>
      )}

      {/* MODE B: USE EXISTING SAVED PROFILE */}
      {measurementMode === 'existing' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className={`${LABEL} mb-0`}>{customerName}&apos;s saved measurements</span>
            <Link href={`/dashboard/customers/${customerId}?tab=measurements`} className={BTN_SM}>Manage all</Link>
          </div>
          <SavedProfileList profiles={measurements} selectedId={selectedId} onSelect={onSelect} appointmentId={appointmentId} />
        </div>
      )}

      {/* MODE C: STANDARD OFF-THE-RACK SIZE */}
      {measurementMode === 'standard_size' && (
        <div className="space-y-2">
          <span className={LABEL}>Select Garment Size</span>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <Chip
                key={s}
                active={standardSize === s}
                onClick={() => onStandardSize(s)}
              >
                {s}
              </Chip>
            ))}
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Using standard commercial sizing instead of bespoke body measurements.
          </p>
        </div>
      )}

      {/* MODE D: MEASURE LATER (the note above explains it) */}
    </div>
  );
}
