import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { SectionImageUpload } from './SectionImageUpload';

interface CareAccordionProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly careInstructions: string;
  readonly onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  readonly careImage: string;
  readonly setCareImage: (img: string) => void;
  readonly uploading: boolean;
  readonly onUpload: (file: File | undefined) => void;
}

export function CareAccordion({
  isOpen,
  onToggle,
  careInstructions,
  onChange,
  careImage,
  setCareImage,
  uploading,
  onUpload,
}: CareAccordionProps) {
  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left font-medium text-ink hover:bg-canvas/50 transition-colors cursor-pointer"
      >
        <div>
          <span className="font-semibold text-sm">Garment Care &amp; Alterations FAQ</span>
          <p className="text-xs text-ink-muted mt-0.5">Dry-cleaning rules, laundry instructions, alteration limits</p>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="p-5 border-t border-line bg-canvas/20 space-y-4">
          <div>
            <span className="block text-xs text-ink-muted mb-1">Detailed text description for garment upkeep and store policies:</span>
            <textarea
              rows={4}
              name="care_instructions"
              value={careInstructions}
              onChange={onChange}
              placeholder="Dry clean only. Minor alterations (hem, sleeves) are free within 30 days of purchase..."
              className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
            />
          </div>

          <div className="border-t border-line pt-4 mt-2">
            <label htmlFor="care-upload" className="block text-xs font-semibold text-ink-body mb-2">
              Section Visual Guide / Image (Optional)
            </label>
            <SectionImageUpload
              imageUrl={careImage}
              uploading={uploading}
              uploadId="care-upload"
              alt="Garment Care Guide"
              onRemove={() => setCareImage('')}
              onChange={onUpload}
            />
          </div>
        </div>
      )}
    </div>
  );
}
