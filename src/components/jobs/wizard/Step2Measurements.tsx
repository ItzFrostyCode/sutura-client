'use client';

import React, { useRef } from 'react';
import {
  Ruler,
  Users,
  User,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import type { CustomerMeasurement } from '../form/types';
import { GARMENT_TYPE_OPTIONS, GARMENT_CATEGORY_LABELS } from '../jobHelpers';
import { measurementFieldsFor, type BodyMeasurements } from '@/lib/garmentMeasurements';
import { humanizeMetricKey } from '@/components/measurements/measurementHelpers';
import type { PeopleListState } from '@/components/order-people/usePeopleList';
import {
  PeopleList,
  PersonEditor,
  UnsavedDraftNote,
  droppedMeasurementCount,
  peopleBreakdown,
} from '@/components/order-people/PeopleEditor';

export type IndividualMeasurements = BodyMeasurements;

interface Step2MeasurementsProps {
  isBulkOrder: boolean;
  setIsBulkOrder: (bulk: boolean) => void;
  // Garment Type decides which body measurements are asked.
  garmentCategory: string;
  setGarmentCategory: (value: string) => void;
  // Individual Measurements
  measurements: IndividualMeasurements;
  setMeasurements: React.Dispatch<React.SetStateAction<IndividualMeasurements>>;
  /** The loaded profile's own extra measurements (armhole, cuff…). */
  extraMeasurements: Record<string, string>;
  setExtraMeasurements: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  customerMeasurements: CustomerMeasurement[];
  selectedMeasurementProfileId: string;
  onSelectSavedProfile: (id: string) => void;
  // Bulk: the people on the order (same list + editor as the online order)
  people: PeopleListState;
  teamName: string;
  setTeamName: (name: string) => void;
  // Measurement Sheets Upload
  measurementSheets: string[];
  setMeasurementSheets: React.Dispatch<React.SetStateAction<string[]>>;
  uploadingSheet: boolean;
  onUploadSheet: (file: File) => Promise<void>;
  // Navigation
  onBack: () => void;
  onProceed: () => void;
}

const BULK_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export default function Step2Measurements({
  isBulkOrder,
  setIsBulkOrder,
  garmentCategory,
  setGarmentCategory,
  measurements,
  setMeasurements,
  extraMeasurements,
  setExtraMeasurements,
  customerMeasurements,
  selectedMeasurementProfileId,
  onSelectSavedProfile,
  people,
  teamName,
  setTeamName,
  measurementSheets,
  setMeasurementSheets,
  uploadingSheet,
  onUploadSheet,
  onBack,
  onProceed,
}: Step2MeasurementsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleMetricChange = (field: keyof IndividualMeasurements, val: string) => {
    setMeasurements((prev) => ({ ...prev, [field]: val }));
  };
  const fields = measurementFieldsFor(garmentCategory);

  const bulkCount = people.persons.length;
  const dropped = isBulkOrder ? droppedMeasurementCount(people.persons, garmentCategory) : 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await onUploadSheet(files[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-ink">Body & Order Measurements</h2>
        <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
          Select order mode, record specific tailoring metrics, or attach handwritten measurement cards.
        </p>
      </div>

      {/* Mode Selector: Individual vs. Bulk */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
          Order Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <button
            type="button"
            onClick={() => setIsBulkOrder(false)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs flex items-start gap-3.5 ${
              !isBulkOrder
                ? 'bg-taupe/10 border-taupe ring-1 ring-taupe'
                : 'bg-surface border-line hover:bg-canvas'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                !isBulkOrder ? 'bg-taupe text-white' : 'bg-canvas text-ink-muted'
              }`}
            >
              <User size={18} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-ink">Individual Order</p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Tailored for one customer with specific body dimensions.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkOrder(true)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs flex items-start gap-3.5 ${
              isBulkOrder
                ? 'bg-taupe/10 border-taupe ring-1 ring-taupe'
                : 'bg-surface border-line hover:bg-canvas'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                isBulkOrder ? 'bg-taupe text-white' : 'bg-canvas text-ink-muted'
              }`}
            >
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-ink">Bulk Order</p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Batch sizes (S, M, L, XL) or team roster for organizations.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Garment Type: picked here (not in Order Specifications) because it
          decides which body measurements below are needed. */}
      <div className="space-y-1.5 max-w-lg">
        <label htmlFor="garment-type" className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
          Garment Type
        </label>
        <select
          id="garment-type"
          value={garmentCategory}
          onChange={(e) => setGarmentCategory(e.target.value)}
          className="w-full h-11 px-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe cursor-pointer shadow-2xs"
        >
          <option value="">-- Select Garment Type --</option>
          {GARMENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          {garmentCategory && !GARMENT_TYPE_OPTIONS.some((o) => o.value === garmentCategory) && (
            <option value={garmentCategory}>{GARMENT_CATEGORY_LABELS[garmentCategory] ?? garmentCategory}</option>
          )}
        </select>
        <p className="text-[11px] text-ink-muted">
          {GARMENT_TYPE_OPTIONS.find((o) => o.value === garmentCategory)?.examples
            ?? 'Pick Top, Bottom, Full Set, Gown or Outerwear to show only the measurements it needs.'}
        </p>
        {dropped > 0 && (
          <p role="status" className="text-[11px] text-danger">
            {dropped === 1 ? '1 saved person has' : `${dropped} saved people have`} measurements this garment type doesn&apos;t use. Those won&apos;t be saved.
          </p>
        )}
      </div>

      {/* INDIVIDUAL MEASUREMENTS FORM */}
      {!isBulkOrder ? (
        <div className="space-y-5 p-5 bg-canvas/30 border border-line/70 rounded-2xl">
          {/* Saved profiles selector if available */}
          {customerMeasurements.length > 0 && (
            <div className="space-y-1.5 pb-3 border-b border-line">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                Load Saved Measurement Profile
              </label>
              <select
                value={selectedMeasurementProfileId}
                onChange={(e) => onSelectSavedProfile(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm font-medium text-ink focus:outline-none focus:border-taupe cursor-pointer shadow-2xs"
              >
                <option value="">-- Enter New Measurements Below --</option>
                {customerMeasurements.map((p) => (
                  <option key={p.id} value={p.id.toString()}>
                    {p.profile_name} (Updated {new Date(p.updated_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Unit Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Standard Garment Measurements
            </span>
            <div className="flex items-center p-0.5 bg-canvas border border-line rounded-lg">
              <button
                type="button"
                onClick={() => handleMetricChange('unit', 'in')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  measurements.unit === 'in'
                    ? 'bg-taupe text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => handleMetricChange('unit', 'cm')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  measurements.unit === 'cm'
                    ? 'bg-taupe text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          {/* Only the measurements this Garment Type needs (all of them until one is picked). */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {fields.map((f) => (
              <div key={f.key}>
                <label htmlFor={`m-${f.key}`} className="block text-xs font-semibold text-ink mb-1">
                  {f.label} ({measurements.unit})
                </label>
                <input
                  id={`m-${f.key}`}
                  type="number"
                  step="0.25"
                  value={measurements[f.key]}
                  onChange={(e) => handleMetricChange(f.key, e.target.value)}
                  placeholder={`e.g. ${f.hint}`}
                  className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
                />
              </div>
            ))}
          </div>

          {/* The loaded profile's own extra measurements, saved with the order too. */}
          {Object.keys(extraMeasurements).length > 0 && (
            <div className="space-y-3 pt-4 border-t border-line">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Other measurements</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                {Object.entries(extraMeasurements).map(([key, value]) => (
                  <div key={key}>
                    <label htmlFor={`mx-${key}`} className="block text-xs font-semibold text-ink mb-1">
                      {humanizeMetricKey(key)} ({measurements.unit})
                    </label>
                    <input
                      id={`mx-${key}`}
                      type="number"
                      step="0.25"
                      value={value}
                      onChange={(e) => setExtraMeasurements((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* BULK: same people list + editor as the customer's online order. */
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="bulk-team-name" className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              Team / Organization Name <span className="normal-case tracking-normal font-normal">(Optional)</span>
            </label>
            <input
              id="bulk-team-name"
              type="text"
              maxLength={255}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. ABC Corp. Admin Dept., San Antonio Youth Basketball"
              className="w-full h-11 px-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
            />
          </div>

          <PeopleList people={people} garmentType={garmentCategory} />

          <div data-field="job-people">
            <PersonEditor people={people} sizes={BULK_SIZES} garmentType={garmentCategory} showPrintFields />
          </div>

          <UnsavedDraftNote people={people} />

          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-canvas/40 border border-line rounded-xl">
            <p className="text-sm font-bold text-ink tabular-nums">
              {bulkCount} {bulkCount === 1 ? 'piece' : 'pieces'} total
            </p>
            <p className="text-xs text-ink-muted text-right">
              {bulkCount === 0 ? 'Add at least 1 person to continue.' : `${peopleBreakdown(people.persons)} · one piece each`}
            </p>
          </div>
        </div>
      )}

      {/* REFERENCE UPLOAD DROPZONE (Sulat sa Papel / Card) */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
            Photos of Measurement Card or Paper Sheet (&quot;Sulat sa Papel&quot;)
          </label>
          <p className="text-xs text-ink-muted mt-0.5">
            Snap a photo of the client&apos;s handwritten measurement paper, notebook, or tailoring card.
          </p>
        </div>

        {/* Dropzone Container */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-line hover:border-taupe rounded-2xl p-6 text-center bg-canvas/30 hover:bg-canvas/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-11 h-11 rounded-full bg-surface border border-line flex items-center justify-center text-taupe group-hover:scale-105 transition-transform shadow-2xs">
            {uploadingSheet ? (
              <Loader2 size={20} className="animate-spin text-taupe" />
            ) : (
              <Upload size={20} />
            )}
          </div>

          <div>
            <p className="text-xs sm:text-sm font-bold text-ink">
              {uploadingSheet ? 'Uploading photo...' : 'Click or drag photo of handwritten paper'}
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Supports JPEG, PNG, WEBP from camera or gallery
            </p>
          </div>
        </div>

        {/* Uploaded Sheet Previews */}
        {measurementSheets.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {measurementSheets.map((url, idx) => (
              <div
                key={url}
                className="relative group rounded-xl overflow-hidden border border-line bg-surface shadow-2xs aspect-video flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Measurement Sheet ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMeasurementSheets((prev) => prev.filter((u) => u !== url));
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/80 text-white flex items-center justify-center hover:bg-danger transition-colors cursor-pointer shadow-xs"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 border-t border-line flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="h-11 px-5 rounded-xl border border-line bg-surface hover:bg-canvas text-ink text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="h-11 px-6 rounded-xl bg-taupe hover:bg-taupe-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
        >
          <span>Next: Order Specifications</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
