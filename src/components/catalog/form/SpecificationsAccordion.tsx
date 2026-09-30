import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { BulletItem } from '../catalogTypes';
import { SpecificationBulletsEditor } from './SpecificationBulletsEditor';

interface SpecificationsAccordionProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly features: BulletItem[];
  readonly setFeatures: React.Dispatch<React.SetStateAction<BulletItem[]>>;
}

export function SpecificationsAccordion({
  isOpen,
  onToggle,
  features,
  setFeatures,
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
          <p className="text-xs text-ink-muted mt-0.5">Extra rows for the Specification table, e.g. Fit — Regular</p>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="p-5 border-t border-line bg-canvas/20">
          <SpecificationBulletsEditor
            features={features}
            setFeatures={setFeatures}
          />
        </div>
      )}
    </div>
  );
}
