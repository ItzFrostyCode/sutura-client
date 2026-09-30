'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { PageMeta } from '../useAdminList';

export function StatCard({ label, value, hint }: { readonly label: string; readonly value: React.ReactNode; readonly hint?: string }) {
  return (
    <div className="border border-line bg-surface p-5">
      <p className="text-eyebrow">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Pager({ meta, onPage }: { readonly meta: PageMeta | null; readonly onPage: (page: number) => void }) {
  if (!meta || meta.last_page <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-muted">
      <span>Page {meta.current_page} of {meta.last_page} · {meta.total} total</span>
      <div className="flex gap-1">
        <button type="button" aria-label="Previous page" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)} className="flex h-11 w-11 items-center justify-center border border-line disabled:opacity-40">
          <ChevronLeft size={18} />
        </button>
        <button type="button" aria-label="Next page" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)} className="flex h-11 w-11 items-center justify-center border border-line disabled:opacity-40">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

/** Loading / error / empty states shared by every admin list card. */
export function ListState({ loading, error, empty, emptyText }: { readonly loading: boolean; readonly error: string; readonly empty: boolean; readonly emptyText: string }) {
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-faint" /></div>;
  if (error) return <p className="px-4 py-12 text-center text-sm text-danger">{error}</p>;
  if (empty) return <p className="px-4 py-12 text-center text-sm text-ink-muted">{emptyText}</p>;
  return null;
}

interface TabOption { value: string; label: string; count?: number }

export function FilterTabs({ options, value, onChange }: { readonly options: TabOption[]; readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <div className="flex overflow-x-auto hide-scrollbar" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={`min-h-12 shrink-0 whitespace-nowrap border-b-2 px-4 text-sm transition-colors ${value === o.value ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}>
          {o.label}{o.count !== undefined && <span className="ml-1.5 text-ink-faint">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
