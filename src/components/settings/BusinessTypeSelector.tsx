import React from 'react';
import { Building2, Scissors, Sparkles } from 'lucide-react';

interface BusinessTypeSelectorProps {
  readonly businessType: string;
  readonly onChange: (value: string) => void;
}

const OPTIONS = [
  { value: 'tailoring_store', label: 'Tailoring Store', desc: 'Custom measurements, job orders & production tracking', Icon: Scissors },
  { value: 'fashion_designer', label: 'Fashion Designer', desc: 'Portfolio showcase, catalog of original designs & commissions', Icon: Sparkles },
  { value: 'hybrid', label: 'Hybrid', desc: 'Both tailoring services and original fashion designs', Icon: Building2 },
];

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  tailoring_store: 'Tailoring Store',
  fashion_designer: 'Fashion Designer',
  hybrid: 'Hybrid',
};

export default function BusinessTypeSelector({ businessType, onChange }: BusinessTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {OPTIONS.map((opt) => {
        const OptionIcon = opt.Icon;
        const isSelected = businessType === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left p-3.5 border-2 transition-all cursor-pointer ${
              isSelected ? 'border-taupe bg-canvas' : 'border-line hover:border-line-strong bg-white'
            }`}
          >
            <div className="w-8 h-8 bg-canvas border border-line flex items-center justify-center mb-2 text-taupe">
              <OptionIcon size={16} />
            </div>
            <div className="font-semibold text-ink text-sm mb-0.5">{opt.label}</div>
            <div className="text-xs text-ink-faint leading-snug">{opt.desc}</div>
            {isSelected && <div className="mt-2 text-xs font-medium text-taupe">✓ Selected</div>}
          </button>
        );
      })}
    </div>
  );
}
