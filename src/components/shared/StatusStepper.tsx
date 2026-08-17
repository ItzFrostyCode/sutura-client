import React from 'react';
import { Check, type LucideIcon } from 'lucide-react';

export interface StepperStage {
  key: string;
  label: string;
  Icon: LucideIcon;
}

interface StatusStepperProps {
  readonly stages: StepperStage[];
  readonly currentKey: string;
  readonly onStageClick?: (key: string) => void;
}

// Flat, no shadow/glow — the current stage is marked by fill + a thin ring
// only, matching the "clean, simple, modern" direction. Reused by
// JobProductionTimeline (staff-facing, clickable) and any future read-only
// customer-facing tracker built on the same stage data.
export default function StatusStepper({ stages, currentKey, onStageClick }: StatusStepperProps) {
  const currentIdx = stages.findIndex(s => s.key === currentKey);

  return (
    <div className="overflow-x-auto pb-2 -mb-2 hide-scrollbar touch-pan-x">
      <div className="flex items-start min-w-[680px] sm:min-w-full">
        {stages.map((stage, idx) => {
          const isCurrent = idx === currentIdx;
          const isDone = idx < currentIdx || (isCurrent && idx === stages.length - 1);

          let iconClass = 'bg-sunken border-line text-ink-faint';
          if (isDone) {
            iconClass = 'bg-sage border-sage text-white';
          } else if (isCurrent) {
            iconClass = 'bg-taupe border-taupe text-white ring-2 ring-taupe/25';
          }

          let labelColor = 'text-ink-faint';
          if (isCurrent) {
            labelColor = 'text-taupe font-bold';
          } else if (isDone) {
            labelColor = 'text-sage font-semibold';
          }

          const StageIcon = isDone ? Check : stage.Icon;
          const clickable = !!onStageClick;

          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-[65px]">
              <button
                type="button"
                onClick={clickable ? () => onStageClick(stage.key) : undefined}
                disabled={!clickable}
                title={clickable ? `Set to ${stage.label}` : stage.label}
                className={`flex flex-col items-center flex-1 min-w-0 group ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Fixed-height Circle Track: keeps all circles on the identical vertical center */}
                <div className="h-9 flex items-center justify-center w-full">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors border-2 shrink-0 ${iconClass}`}>
                    <StageIcon size={15} strokeWidth={2.4} />
                  </div>
                </div>

                {/* Top-aligned Label Container: handles 1-line and 2-line labels without shifting circle position */}
                <div className="h-8 flex items-start justify-center w-full mt-1.5 px-0.5">
                  <span className={`text-[10px] leading-tight text-center ${labelColor}`}>
                    {stage.label}
                  </span>
                </div>
              </button>

              {/* Connecting Line: anchored to circle center (top-4.5) so it is 100% level */}
              {idx < stages.length - 1 && (
                <div className="h-9 flex items-center shrink-0 w-2.5 sm:w-3 -mt-8">
                  <div className={`h-0.5 w-full ${idx < currentIdx ? 'bg-sage' : 'bg-line'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
