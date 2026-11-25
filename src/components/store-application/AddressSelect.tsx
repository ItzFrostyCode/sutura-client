'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, RotateCcw } from 'lucide-react';
import type { PsgcItem } from '@/lib/psgc';

const MAX_SHOWN = 200;

// "Peña" matches "pena": compare without accents, case-insensitive.
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Searchable dropdown (ARIA combobox) for one PSGC level. Only listed values
 * can be chosen: typed text that isn't picked from the list is dropped when
 * the field loses focus. Same flat look as the other application fields.
 */
export default function AddressSelect({
  id, label, required = false, optional = false, items, value, onChange,
  disabled = false, disabledHint, loading = false, loadError = '', onRetry, error = '', placeholder,
}: {
  readonly id: string;
  readonly label: string;
  readonly required?: boolean;
  readonly optional?: boolean;
  readonly items: PsgcItem[];
  readonly value: string;
  readonly onChange: (item: PsgcItem | null) => void;
  readonly disabled?: boolean;
  readonly disabledHint?: string;
  readonly loading?: boolean;
  readonly loadError?: string;
  readonly onRetry?: () => void;
  readonly error?: string;
  readonly placeholder?: string;
}) {
  const listId = useId();
  const messageId = `${id}-message`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = items.find((i) => i.code === value) ?? null;
  const [query, setQuery] = useState(selected?.name ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Show the chosen name whenever the selection (or list) changes.
  useEffect(() => { setQuery(selected?.name ?? ''); }, [selected?.name]);

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    // Showing the current choice: list everything so it's easy to switch.
    if (!q || (selected && query === selected.name)) return items;
    return items.filter((i) => fold(i.name).includes(q));
  }, [items, query, selected]);
  const shown = filtered.slice(0, MAX_SHOWN);

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    if (open) (listRef.current?.children[active] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (item: PsgcItem) => {
    onChange(item);
    setQuery(item.name);
    setOpen(false);
  };

  const close = () => {
    setOpen(false);
    // No free text: anything not picked from the list goes back to the choice.
    setQuery(selected?.name ?? '');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, shown.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') {
      if (open && shown[active]) { e.preventDefault(); pick(shown[active]); }
    } else if (e.key === 'Escape') { if (open) { e.preventDefault(); close(); } }
  };

  const message = loadError || error || (disabled ? disabledHint : '') || '';
  const tone = loadError || error ? 'text-danger' : 'text-ink-muted';

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm text-ink mb-2">
        {label}
        {required && <span className="text-danger">*</span>}
        {optional && <span className="text-ink-muted"> (optional)</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && shown[active] ? `${id}-opt-${shown[active].code}` : undefined}
          aria-invalid={!!(error || loadError) || undefined}
          aria-describedby={message ? messageId : undefined}
          aria-required={required || undefined}
          disabled={disabled || loading}
          value={loading ? '' : query}
          placeholder={loading ? 'Loading…' : placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setTimeout(close, 120)}
          onKeyDown={onKeyDown}
          className={`w-full min-h-12 py-3 pl-3.5 pr-10 border bg-surface text-ink text-base placeholder:text-ink-faint focus:outline-none transition-colors disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-muted ${
            error || loadError ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-ink'
          }`}
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </span>

        {open && !disabled && !loading && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto border border-ink bg-surface shadow-lg"
          >
            {shown.length === 0 ? (
              <li className="px-3.5 py-3 text-sm text-ink-muted">No match. Check the spelling, or pick from the list.</li>
            ) : (
              shown.map((item, i) => (
                <li
                  key={item.code}
                  id={`${id}-opt-${item.code}`}
                  role="option"
                  aria-selected={item.code === value}
                  // mousedown, not click: runs before the input's blur closes the list.
                  onMouseDown={(e) => { e.preventDefault(); pick(item); }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex min-h-11 cursor-pointer items-center px-3.5 text-sm ${
                    i === active ? 'bg-sunken text-ink' : 'text-ink'
                  } ${item.code === value ? 'font-semibold' : ''}`}
                >
                  {item.name}
                </li>
              ))
            )}
            {filtered.length > MAX_SHOWN && (
              <li className="px-3.5 py-2 text-xs text-ink-muted">Showing {MAX_SHOWN} of {filtered.length}. Keep typing to narrow it down.</li>
            )}
          </ul>
        )}
      </div>

      {message && (
        <p id={messageId} role={error || loadError ? 'alert' : undefined} className={`mt-1.5 flex flex-wrap items-center gap-x-2 text-xs ${tone}`}>
          {message}
          {loadError && onRetry && (
            <button type="button" onClick={onRetry} className="inline-flex min-h-8 items-center gap-1 font-semibold text-ink underline underline-offset-2">
              <RotateCcw size={12} aria-hidden="true" /> Try again
            </button>
          )}
        </p>
      )}
    </div>
  );
}
