import React from 'react';
import { Shirt } from 'lucide-react';

/** Fits the online order (server max 500) and the booking notes it's added to. */
const MAX_DESCRIPTION = 300;

interface BookingMaterialSelectorProps {
  readonly materialSource: 'own' | 'shop' | '';
  readonly setMaterialSource: (val: 'own' | 'shop' | '') => void;
  readonly materialDescription: string;
  readonly setMaterialDescription: (val: string) => void;
  /** Shown under the choices when "own fabric" is picked (online orders: drop-off deadline). */
  readonly ownFabricNote?: React.ReactNode;
  /** Online order look: rounded white cards and field. Booking keeps square ones. */
  readonly rounded?: boolean;
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
  ownFabricNote,
  rounded = false,
}: BookingMaterialSelectorProps) {
  const corner = rounded ? 'rounded-lg' : 'rounded-none';
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
              className={`min-h-[52px] p-3.5 ${corner} border text-left transition-all cursor-pointer flex items-center gap-3 ${
                isSelected
                  ? rounded ? 'border-taupe bg-taupe/10 shadow-sm' : 'border-taupe bg-taupe/5 ring-2 ring-taupe/20'
                  : 'border-line bg-surface hover:border-taupe/40'
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

      {materialSource === 'own' && ownFabricNote}

      {materialSource === 'own' && (
        <div className="pt-1 space-y-1.5">
          <label htmlFor="material-description" className="mobile-caption font-semibold text-ink-body block">
            Describe your fabric <span className="text-ink-faint font-normal">(Optional)</span>
          </label>
          <p id="material-description-hint" className="mobile-caption text-ink-muted">
            Helps the shop check it&apos;s enough and right for the garment: the type, color, how much you have, and anything to watch out for (stretchy, thin, has a pattern to match).
          </p>
          <textarea
            id="material-description"
            rows={3}
            maxLength={MAX_DESCRIPTION}
            aria-describedby="material-description-hint material-description-count"
            placeholder="e.g. 3 yards navy blue gabardine, slightly stretchy. Bringing a sample shirt too for the fit."
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            className={`w-full min-h-24 ${rounded ? 'bg-surface rounded-lg focus:ring-2 focus:ring-taupe/15' : 'bg-canvas rounded-none'} border border-line px-4 py-3 text-base text-ink leading-relaxed resize-y transition-colors focus:outline-none focus:border-taupe placeholder:text-ink-faint`}
          />
          <p id="material-description-count" className="mobile-caption text-ink-faint text-right tabular-nums">
            {materialDescription.length}/{MAX_DESCRIPTION}
          </p>
        </div>
      )}
    </div>
  );
}
