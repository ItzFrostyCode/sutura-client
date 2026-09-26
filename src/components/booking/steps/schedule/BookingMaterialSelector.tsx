import React from 'react';
import { Shirt } from 'lucide-react';

interface BookingMaterialSelectorProps {
  readonly materialSource: 'own' | 'shop' | '';
  readonly setMaterialSource: (val: 'own' | 'shop' | '') => void;
  readonly materialDescription: string;
  readonly setMaterialDescription: (val: string) => void;
}

// A structured form choice, not a chatbot — the customer only needs to tell
// the shop HOW the material will be provided; the shop/staff handles any
// technical suitability discussion in person. No fabric inventory, no
// technical classification.
export default function BookingMaterialSelector({
  materialSource,
  setMaterialSource,
  materialDescription,
  setMaterialDescription,
}: BookingMaterialSelectorProps) {
  return (
    <div className="space-y-2.5">
      <label className="mobile-h4 text-ink flex items-center gap-1.5">
        <Shirt size={16} className="text-taupe" /> Material / Fabric
      </label>
      <p className="mobile-caption text-ink-faint font-normal -mt-1">How will the material be provided?</p>

      <div className="grid grid-cols-1 gap-2.5">
        {(
          [
            { value: 'own' as const, label: "I'll bring my own fabric/sample" },
            { value: 'shop' as const, label: "I'll use the shop's material" },
          ]
        ).map((opt) => {
          const isSelected = materialSource === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMaterialSource(opt.value)}
              className={`min-h-[52px] p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                isSelected ? 'border-taupe bg-taupe/5 ring-2 ring-taupe/20' : 'border-line bg-surface hover:border-taupe/40'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-taupe bg-taupe' : 'border-line bg-surface'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className={`text-sm font-medium ${isSelected ? 'text-ink' : 'text-ink-body'}`}>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {materialSource === 'own' && (
        <div className="pt-1 space-y-1.5">
          <label htmlFor="material-description" className="mobile-caption font-semibold text-ink-body block">
            What are you bringing? <span className="text-ink-faint font-normal">(Optional)</span>
          </label>
          <input
            id="material-description"
            type="text"
            maxLength={120}
            placeholder="e.g. Cotton fabric"
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            className="w-full h-[48px] bg-canvas border border-line rounded-xl px-4 text-base text-ink focus:outline-none focus:border-taupe placeholder:text-ink-faint"
          />
        </div>
      )}
    </div>
  );
}
