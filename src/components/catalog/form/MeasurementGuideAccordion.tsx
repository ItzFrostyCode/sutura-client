import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { SectionImageUpload } from './SectionImageUpload';

interface MeasurementGuideAccordionProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly measurementGuide: string;
  readonly onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  readonly measurementGuideImage: string;
  readonly setMeasurementGuideImage: (img: string) => void;
  readonly uploading: boolean;
  readonly onUpload: (file: File | undefined) => void;
}

export function MeasurementGuideAccordion({
  isOpen,
  onToggle,
  measurementGuide,
  onChange,
  measurementGuideImage,
  setMeasurementGuideImage,
  uploading,
  onUpload,
}: MeasurementGuideAccordionProps) {
  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left font-medium text-ink hover:bg-canvas/50 transition-colors cursor-pointer"
      >
        <div>
          <span className="font-semibold text-sm">Measurement Guide</span>
          <p className="text-xs text-ink-muted mt-0.5">How to take measurements, fit notes, sizing tips</p>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="p-5 border-t border-line bg-canvas/20 space-y-4">
          <div>
            <span className="block text-xs text-ink-muted mb-1">Explain how a customer should measure themselves, or any fit notes for this design:</span>
            <textarea
              rows={4}
              name="measurement_guide"
              value={measurementGuide}
              onChange={onChange}
              placeholder="Measure around the fullest part of your chest, keeping the tape level..."
              className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
            />
          </div>

          <div className="border-t border-line pt-4 mt-2">
            <label htmlFor="measurement-guide-upload" className="block text-xs font-semibold text-ink-body mb-2">
              Section Visual Guide / Image (Optional)
            </label>
            <SectionImageUpload
              imageUrl={measurementGuideImage}
              uploading={uploading}
              uploadId="measurement-guide-upload"
              alt="Measurement Guide"
              onRemove={() => setMeasurementGuideImage('')}
              onChange={onUpload}
            />
          </div>
        </div>
      )}
    </div>
  );
}
