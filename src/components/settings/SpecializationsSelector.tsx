import React from 'react';
import { Baby, Printer, Ruler, Scissors, Shirt, Sparkles, Theater, Users, type LucideIcon } from 'lucide-react';
import { STORE_SPECIALIZATIONS } from '@/lib/storeSpecializations';

interface SpecializationsSelectorProps {
  readonly specializations: string[];
  readonly onChange: (specializations: string[]) => void;
}

const ICONS: Record<string, LucideIcon> = {
  men: Shirt,
  women: Sparkles,
  children: Baby,
  custom_tailoring: Ruler,
  alterations_repairs: Scissors,
  uniform_production: Users,
  printing_sublimation: Printer,
  custom_costume_creation: Theater,
};

const OPTIONS = STORE_SPECIALIZATIONS.map((s) => ({ id: s.value, label: s.label, Icon: ICONS[s.value] ?? Scissors }));

export default function SpecializationsSelector({ specializations, onChange }: SpecializationsSelectorProps) {
  const toggle = (id: string) => {
    onChange(specializations.includes(id) ? specializations.filter((s) => s !== id) : [...specializations, id]);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-muted">
        The same Men / Women / Kids and Services categories customers browse from the site header.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {OPTIONS.map((spec) => {
          const isChecked = specializations.includes(spec.id);
          const SpecIcon = spec.Icon;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => toggle(spec.id)}
              className={`flex items-center gap-2 p-2.5 border text-xs font-medium text-left transition-all cursor-pointer ${
                isChecked ? 'border-taupe bg-canvas text-ink' : 'border-line bg-white text-ink-body hover:bg-canvas'
              }`}
            >
              <SpecIcon size={14} className="shrink-0 text-current" />
              <span className="flex-1">{spec.label}</span>
              <span
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] shrink-0 ${
                  isChecked ? 'border-taupe bg-taupe text-white' : 'border-line'
                }`}
              >
                {isChecked ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
