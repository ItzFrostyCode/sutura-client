import React from 'react';
import { ChevronsLeftRight, ChevronsRightLeft, Columns3, Rows3 } from 'lucide-react';
import type { KanbanPrefs } from './useKanbanPrefs';

interface BoardControlsProps {
  readonly prefs: KanbanPrefs;
  readonly columns: { id: string }[];
  /** Orders per stage, whole shop. */
  readonly counts: Record<string, number>;
}

/** "Collapse Inactive / Expand All" and the Unified | Swimlanes switch. */
export default function BoardControls({ prefs, columns, counts }: BoardControlsProps) {
  const anyCollapsed = prefs.collapsedColumns.length > 0;
  const inactive = columns.filter((c) => (counts[c.id] ?? 0) === 0).map((c) => c.id);

  const views = [
    { id: 'unified' as const, label: 'Unified', title: 'Single unified board', icon: <Columns3 size={13} /> },
    { id: 'swimlanes' as const, label: 'Swimlanes', title: 'One lane per department', icon: <Rows3 size={13} /> },
  ];

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        title="Collapse empty stages / expand all"
        onClick={() => prefs.setColumnsCollapsed(anyCollapsed ? [] : inactive)}
        className="hidden h-9.5 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-canvas px-3 text-xs font-semibold text-ink-body transition-colors hover:bg-surface sm:flex"
      >
        {anyCollapsed ? <ChevronsLeftRight size={13} /> : <ChevronsRightLeft size={13} />}
        {anyCollapsed ? 'Expand All' : 'Collapse Inactive'}
      </button>

      <div role="group" aria-label="Board layout" className="flex h-9.5 items-center gap-1 rounded-lg border border-line bg-canvas p-1">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            title={v.title}
            aria-pressed={prefs.view === v.id}
            onClick={() => prefs.setView(v.id)}
            className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-all ${
              prefs.view === v.id ? 'border border-line/80 bg-surface text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {v.icon}
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
