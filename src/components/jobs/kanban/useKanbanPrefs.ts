import { useCallback, useState } from 'react';

export type KanbanView = 'unified' | 'swimlanes';

const KEYS = {
  view: 'sutura_kanban_view',
  columns: 'sutura_collapsed_columns',
  lanes: 'sutura_collapsed_swimlanes',
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private window / blocked storage: the board still works, it just won't remember
  }
}

/** View mode and which columns / swimlanes are collapsed, remembered per browser. */
export function useKanbanPrefs() {
  const [view, setViewState] = useState<KanbanView>(() => (read<string>(KEYS.view, 'unified') === 'swimlanes' ? 'swimlanes' : 'unified'));
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>(() => read<string[]>(KEYS.columns, []));
  const [collapsedLanes, setCollapsedLanes] = useState<string[]>(() => read<string[]>(KEYS.lanes, []));

  const setView = useCallback((next: KanbanView) => {
    setViewState(next);
    write(KEYS.view, next);
  }, []);

  const toggleColumn = useCallback((id: string) => {
    setCollapsedColumns((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      write(KEYS.columns, next);
      return next;
    });
  }, []);

  const setColumnsCollapsed = useCallback((ids: string[]) => {
    setCollapsedColumns(ids);
    write(KEYS.columns, ids);
  }, []);

  const toggleLane = useCallback((id: string) => {
    setCollapsedLanes((prev) => {
      const next = prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id];
      write(KEYS.lanes, next);
      return next;
    });
  }, []);

  return { view, setView, collapsedColumns, toggleColumn, setColumnsCollapsed, collapsedLanes, toggleLane };
}

export type KanbanPrefs = ReturnType<typeof useKanbanPrefs>;
