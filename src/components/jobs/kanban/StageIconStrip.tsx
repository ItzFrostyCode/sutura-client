import React from 'react';
import type { StageIconFilter } from '../stageIconFilters';

interface StageIconStripProps {
  readonly filters: StageIconFilter[];
  readonly value: string;
  readonly onChange: (id: string) => void;
}

/** Icon-only stage filters (with the notification dots). Picking one also scrolls the board to that stage. */
export default function StageIconStrip({ filters, value, onChange }: StageIconStripProps) {
  return (
    <div className="hide-scrollbar flex h-11 w-full touch-pan-x items-center gap-1.5 overflow-x-auto rounded-xl border border-line bg-canvas p-1 sm:h-9.5 sm:w-auto sm:gap-1 sm:rounded-lg">
      {filters.map((stage) => {
        const Icon = stage.icon;
        return (
          <button
            key={stage.id}
            type="button"
            title={stage.title}
            aria-pressed={value === stage.id}
            onClick={() => {
              onChange(stage.id);
              if (stage.id !== 'all') {
                document
                  .querySelector<HTMLElement>(`[data-kanban-col][data-col-id="${stage.id}"]`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }
            }}
            className={`relative flex h-9 min-w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-95 sm:h-7 sm:min-w-8 sm:rounded-md ${
              value === stage.id ? 'border border-line/90 bg-surface font-bold text-ink shadow-xs' : 'text-ink-muted hover:bg-surface/50 hover:text-ink'
            }`}
          >
            <Icon size={16} className={stage.iconColor ?? ''} />
            {stage.dotColor && <span className={`absolute right-1 top-1 h-2 w-2 rounded-full ring-1 ring-white sm:h-1.5 sm:w-1.5 ${stage.dotColor}`} />}
          </button>
        );
      })}
    </div>
  );
}
