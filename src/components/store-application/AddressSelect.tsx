'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, RotateCcw, X } from 'lucide-react';
import type { PsgcItem } from '@/lib/psgc';
import { FIELD, FIELD_ERROR, FieldError, LABEL, Req } from './ApplicationFields';

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
      // Never presses Continue: picks the highlighted match, or opens the list.
      e.preventDefault();
      if (open && shown[active]) pick(shown[active]);
      else setOpen(true);
    } else if (e.key === 'Escape') { if (open) { e.preventDefault(); close(); } }
  };

  const message = loadError || error || (disabled ? disabledHint : '') || '';
  const tone = loadError || error ? 'text-danger' : 'text-ink-muted';

  return (
    <div className="relative" data-field={id}>
      <label htmlFor={id} className={LABEL}>
        <span>{label}{required && <Req />}</span>
        {optional && !required && <span className="font-normal text-ink-faint">Optional</span>}
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
          className={`${FIELD} ${value ? 'pr-16' : 'pr-10'} ${error || loadError ? FIELD_ERROR : ''}`}
        />
        {/* Clear the pick (e.g. no district, to search the barangays of the whole city again). */}
        {value && !disabled && !loading && (
          <button type="button" aria-label={`Clear ${label}`} tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onChange(null); setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-9 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-sunken hover:text-ink">
            <X size={15} aria-hidden="true" />
          </button>
        )}
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted">
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </span>

        {open && !disabled && !loading && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl bg-surface p-1 shadow-[0_10px_30px_rgba(0,0,0,0.14)] ring-1 ring-line/80"
          >
            {shown.length === 0 ? (
              <li className="px-3 py-3 text-[15px] text-ink-muted">No match. Check the spelling, or pick from the list.</li>
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
                  className={`flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-[15px] ${
                    i === active ? 'bg-sunken text-ink' : 'text-ink'
                  } ${item.code === value ? 'font-semibold' : ''}`}
                >
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {item.district && <span className="ml-3 shrink-0 text-xs text-ink-muted">{item.district}</span>}
                </li>
              ))
            )}
            {filtered.length > MAX_SHOWN && (
              <li className="px-3 py-2 text-[13px] text-ink-muted">Showing {MAX_SHOWN} of {filtered.length}. Keep typing to narrow it down.</li>
            )}
          </ul>
        )}
      </div>

      {error && !loadError ? <FieldError id={messageId} message={error} /> : message && (
        <p id={messageId} role={loadError ? 'alert' : undefined} className={`mt-1.5 flex flex-wrap items-center gap-x-2 text-[13px] ${tone}`}>
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
