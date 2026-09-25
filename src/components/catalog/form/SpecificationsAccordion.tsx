import React from 'react';
import { ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import { BulletItem } from '../catalogTypes';
import { SectionImageUpload } from './SectionImageUpload';

interface SpecificationsAccordionProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly features: BulletItem[];
  readonly setFeatures: React.Dispatch<React.SetStateAction<BulletItem[]>>;
  readonly featuresImage: string;
  readonly setFeaturesImage: (img: string) => void;
  readonly uploading: boolean;
  readonly onUpload: (file: File | undefined) => void;
}

export function SpecificationsAccordion({
  isOpen,
  onToggle,
  features,
  setFeatures,
  featuresImage,
  setFeaturesImage,
  uploading,
  onUpload,
}: SpecificationsAccordionProps) {
  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left font-medium text-ink hover:bg-canvas/50 transition-colors cursor-pointer"
      >
        <div>
          <span className="font-semibold text-sm">Product Specifications</span>
          <p className="text-xs text-ink-muted mt-0.5">Collar designs, cuffs, embroidery details, linings</p>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="p-5 border-t border-line bg-canvas/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Dynamic details that list out product specifications.</span>
            <button
              type="button"
              onClick={() => setFeatures([...features, { id: Math.random().toString(), text: '' }])}
              className="text-taupe text-xs font-semibold hover:text-taupe-hover flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> Add Bullet
            </button>
          </div>

          <div className="space-y-3">
            {features.map((feat, idx) => (
              <div key={feat.id} className="flex gap-2">
                <input
                  type="text"
                  value={feat.text}
                  onChange={e => {
                    const newF = [...features];
                    newF[idx] = { ...newF[idx], text: e.target.value };
                    setFeatures(newF);
                  }}
                  placeholder="e.g. Hand-stitched lapel, horn buttons"
                  className="flex-1 px-4 py-2 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-taupe text-sm"
                />
                <button
                  type="button"
                  onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                  className="p-2 text-ink-faint hover:text-danger transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-line pt-4 mt-4">
            <label htmlFor="features-upload" className="block text-xs font-semibold text-ink-body mb-2">
              Section Visual Guide / Image (Optional)
            </label>
            <SectionImageUpload
              imageUrl={featuresImage}
              uploading={uploading}
              uploadId="features-upload"
              alt="Features Spec Guide"
              onRemove={() => setFeaturesImage('')}
              onChange={onUpload}
            />
          </div>
        </div>
      )}
    </div>
  );
}
