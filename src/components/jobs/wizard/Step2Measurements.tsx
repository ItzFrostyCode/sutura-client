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
  Plus,
  Trash2,
} from 'lucide-react';
import type { CustomerMeasurement, RosterMember } from '../form/types';

export interface IndividualMeasurements {
  unit: 'in' | 'cm';
  chest: string;
  waist: string;
  hips: string;
  shoulders: string;
  length: string;
  neck: string;
  sleeve: string;
  inseam: string;
}

interface Step2MeasurementsProps {
  isBulkOrder: boolean;
  setIsBulkOrder: (bulk: boolean) => void;
  // Individual Measurements
  measurements: IndividualMeasurements;
  setMeasurements: React.Dispatch<React.SetStateAction<IndividualMeasurements>>;
  customerMeasurements: CustomerMeasurement[];
  selectedMeasurementProfileId: string;
  onSelectSavedProfile: (id: string) => void;
  // Bulk Breakdown & Roster
  sizeBreakdown: Record<string, string>;
  setSizeBreakdown: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  roster: RosterMember[];
  setRoster: React.Dispatch<React.SetStateAction<RosterMember[]>>;
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
  measurements,
  setMeasurements,
  customerMeasurements,
  selectedMeasurementProfileId,
  onSelectSavedProfile,
  sizeBreakdown,
  setSizeBreakdown,
  roster,
  setRoster,
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

  const handleSizeQtyChange = (size: string, val: string) => {
    const sanitized = val.replace(/[^0-9]/g, '');
    setSizeBreakdown((prev) => ({ ...prev, [size]: sanitized }));
  };

  const totalBulkPieces = Object.values(sizeBreakdown).reduce(
    (acc, cur) => acc + (parseInt(cur, 10) || 0),
    0
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await onUploadSheet(files[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addRosterRow = () => {
    setRoster((prev) => [
      ...prev,
      {
        id: `roster-${Date.now()}`,
        name: '',
        print_name: '',
        number: '',
        size: 'L',
      },
    ]);
  };

  const updateRosterRow = (id: string, field: keyof RosterMember, val: string) => {
    setRoster((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const removeRosterRow = (id: string) => {
    setRoster((prev) => prev.filter((r) => r.id !== id));
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

          {/* 5 Core Required Metrics + 3 Tailoring Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {/* Chest */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Chest / Bust ({measurements.unit})
              </label>
              <input
                type="number"
                step="0.25"
                value={measurements.chest}
                onChange={(e) => handleMetricChange('chest', e.target.value)}
                placeholder="e.g. 38"
                className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
              />
            </div>

            {/* Waist */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Waist ({measurements.unit})
              </label>
              <input
                type="number"
                step="0.25"
                value={measurements.waist}
                onChange={(e) => handleMetricChange('waist', e.target.value)}
                placeholder="e.g. 32"
                className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
              />
            </div>

            {/* Hips */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Hips ({measurements.unit})
              </label>
              <input
                type="number"
                step="0.25"
                value={measurements.hips}
                onChange={(e) => handleMetricChange('hips', e.target.value)}
                placeholder="e.g. 40"
                className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
              />
            </div>

            {/* Shoulders */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Shoulders ({measurements.unit})
              </label>
              <input
                type="number"
                step="0.25"
                value={measurements.shoulders}
                onChange={(e) => handleMetricChange('shoulders', e.target.value)}
                placeholder="e.g. 17.5"
                className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
              />
            </div>

            {/* Garment Length */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Garment Length ({measurements.unit})
              </label>
              <input
                type="number"
                step="0.25"
                value={measurements.length}
                onChange={(e) => handleMetricChange('length', e.target.value)}
                placeholder="e.g. 29"
                className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
              />
            </div>

            {/* Neck */}
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Neck (optional)
              </label>
              <input
                type="number"
                step="0.25"
                value={measurements.neck}
                onChange={(e) => handleMetricChange('neck', e.target.value)}
                placeholder="e.g. 15.5"
                className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
              />
            </div>

            {/* Sleeve */}
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Sleeve (optional)
              </label>
              <input
                type="number"
                step="0.25"
                value={measurements.sleeve}
                onChange={(e) => handleMetricChange('sleeve', e.target.value)}
                placeholder="e.g. 24"
                className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
              />
            </div>

            {/* Inseam */}
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Inseam / Outseam
              </label>
              <input
                type="number"
                step="0.25"
                value={measurements.inseam}
                onChange={(e) => handleMetricChange('inseam', e.target.value)}
                placeholder="e.g. 31"
                className="w-full h-10 px-3 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
              />
            </div>
          </div>
        </div>
      ) : (
        /* BULK MEASUREMENTS FORM */
        <div className="space-y-5 p-5 bg-canvas/30 border border-line/70 rounded-2xl">
          {/* Team / Organization Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Team / Organization / Project Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Barangay San Antonio Youth Basketball, St. Paul Choir"
              className="w-full h-10.5 px-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
            />
          </div>

          {/* Size Breakdown Inputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Size Breakdown Quantities
              </span>
              <span className="text-xs font-bold text-taupe bg-taupe/10 px-2.5 py-0.5 rounded-full border border-taupe/20">
                Total: {totalBulkPieces} pcs
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
              {BULK_SIZES.map((size) => (
                <div key={size} className="text-center">
                  <label className="block text-[11px] font-bold text-ink mb-1">
                    {size}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sizeBreakdown[size] || ''}
                    onChange={(e) => handleSizeQtyChange(size, e.target.value)}
                    placeholder="0"
                    className="w-full h-10 text-center font-bold bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:ring-1 focus:ring-taupe shadow-2xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Team Roster / Member Details (Optional) */}
          <div className="space-y-3 pt-3 border-t border-line">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Team Roster / Player List (Optional)
                </p>
                <p className="text-[11px] text-ink-muted">
                  Names, jersey numbers, and assigned sizes for printed uniforms.
                </p>
              </div>
              <button
                type="button"
                onClick={addRosterRow}
                className="h-8 px-3 rounded-lg bg-surface border border-line text-ink text-xs font-bold flex items-center gap-1 hover:bg-canvas shadow-2xs cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Person</span>
              </button>
            </div>

            {roster.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {roster.map((r, idx) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-surface border border-line shadow-2xs"
                  >
                    <div className="col-span-4 sm:col-span-4">
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => updateRosterRow(r.id, 'name', e.target.value)}
                        placeholder={`Member #${idx + 1}`}
                        className="w-full h-8 px-2.5 bg-canvas/50 border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-3">
                      <input
                        type="text"
                        value={r.print_name}
                        onChange={(e) => updateRosterRow(r.id, 'print_name', e.target.value)}
                        placeholder="Print Name"
                        className="w-full h-8 px-2.5 bg-canvas/50 border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <input
                        type="text"
                        value={r.number}
                        onChange={(e) => updateRosterRow(r.id, 'number', e.target.value)}
                        placeholder="No."
                        className="w-full h-8 px-2 text-center bg-canvas/50 border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <select
                        value={r.size}
                        onChange={(e) => updateRosterRow(r.id, 'size', e.target.value)}
                        className="w-full h-8 px-2 bg-canvas/50 border border-line rounded-lg text-xs font-bold text-ink focus:outline-none focus:border-taupe cursor-pointer"
                      >
                        {BULK_SIZES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeRosterRow(r.id)}
                        className="p-1.5 text-ink-muted hover:text-danger rounded-md cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
