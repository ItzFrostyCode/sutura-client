import React from 'react';

interface MobileStageNavProps {
  readonly columns: { id: string; title: string }[];
  readonly counts: Record<string, number>;
}

/** Phone-only pill strip: tap a stage to scroll the board to that column. */
export default function MobileStageNav({ columns, counts }: MobileStageNavProps) {
  const jump = (id: string) => {
    document
      .querySelector<HTMLElement>(`[data-kanban-col][data-col-id="${id}"]:not([data-collapsed="true"])`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <nav aria-label="Jump to stage" className="hide-scrollbar -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 sm:hidden">
      {columns.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => jump(c.id)}
          className="flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-3.5 text-xs font-semibold text-ink-body active:bg-sunken"
        >
          {c.title}
          <span className="rounded-full bg-sunken px-1.5 text-[10px] font-bold tabular-nums text-ink-muted">{counts[c.id] ?? 0}</span>
        </button>
      ))}
    </nav>
  );
}
