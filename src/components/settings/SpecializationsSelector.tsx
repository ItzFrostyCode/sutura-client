import React from 'react';
import {
  Anchor, Baby, Briefcase, Flower2, Gem, GraduationCap, Ruler, Scissors, Shirt, Sparkles, Stethoscope, Sun, Trophy, X,
  type LucideIcon,
} from 'lucide-react';
import { STORE_SPECIALIZATIONS, specializationLabel } from '@/lib/storeSpecializations';

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
  formal: Gem,
  casual: Sun,
  office: Briefcase,
  school: GraduationCap,
  maritime: Anchor,
  medical: Stethoscope,
  sports: Trophy,
  embroidery: Flower2,
};

const OPTIONS = STORE_SPECIALIZATIONS.map((s) => ({ id: s.value, label: s.label, Icon: ICONS[s.value] ?? Scissors }));
const OPTION_IDS = new Set(OPTIONS.map((o) => o.id));

export default function SpecializationsSelector({ specializations, onChange }: SpecializationsSelectorProps) {
  const toggle = (id: string) => {
    onChange(specializations.includes(id) ? specializations.filter((s) => s !== id) : [...specializations, id]);
  };
  // Saved earlier from a list that has since changed (e.g. "Others") — still
  // shown so the owner can see and remove them.
  const retired = specializations.filter((id) => !OPTION_IDS.has(id));

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-muted">
        Men / Women / Kids plus the services your shop offers. Customers filter shops by these on search and the map.
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
                  isChecked ? 'border-taupe bg-espresso text-white' : 'border-line'
                }`}
              >
                {isChecked ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>
      {retired.length > 0 && (
        <div className="space-y-1.5 border-t border-line pt-2">
          <p className="text-xs text-ink-muted">No longer offered as a choice — remove these and pick from the list above:</p>
          <div className="flex flex-wrap gap-1.5">
            {retired.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                aria-label={`Remove ${specializationLabel(id)}`}
                className="inline-flex min-h-8 items-center gap-1 border border-line bg-sunken px-2 text-xs text-ink-body hover:border-danger/40 hover:text-danger cursor-pointer"
              >
                {specializationLabel(id)}
                <X size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
