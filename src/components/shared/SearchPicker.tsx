import React, { useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SearchPickerProps<T> {
  readonly items: T[];
  /** The chosen item's id, or '' when nothing is chosen. */
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly getId: (item: T) => string;
  /** The text typed into the box is matched against this. */
  readonly getText: (item: T) => string;
  /** Optional: what typing is matched against when that should be more than the shown text (aliases, a group name). */
  readonly getSearchText?: (item: T) => string;
  readonly renderItem: (item: T) => React.ReactNode;
  readonly placeholder: string;
  readonly emptyText?: string;
  readonly id?: string;
  readonly required?: boolean;
}

const MAX_SHOWN = 50;

/**
 * A box you type in. Matching items appear under it as you type, the first one is already highlighted, and
 * leaving the box or pressing Enter picks it. Arrow keys move, Escape closes, the X clears.
 */
export default function SearchPicker<T>({ items, value, onChange, getId, getText, getSearchText, renderItem, placeholder, emptyText = 'Nothing matches', id, required }: SearchPickerProps<T>) {
  const autoId = useId();
  const listId = `${id ?? autoId}-list`;
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const chosen = items.find((i) => getId(i) === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? items.filter((i) => (getSearchText ?? getText)(i).toLowerCase().includes(q)) : items;
    return list.slice(0, MAX_SHOWN);
  }, [items, query, getText, getSearchText]);

  const pick = (item: T) => {
    onChange(getId(item));
    setOpen(false);
    setQuery('');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && open && matches[active]) { e.preventDefault(); pick(matches[active]); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  };

  return (
    <div className="relative" onBlur={(e) => {
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
      // Leaving the box with something typed picks the first match.
      if (open && query.trim() && matches[0]) pick(matches[0]);
      else { setOpen(false); setQuery(''); }
    }}>
      <div className="flex min-h-12 items-center gap-2 rounded-lg border border-line bg-canvas px-3 focus-within:border-taupe">
        <Search size={16} className="shrink-0 text-ink-faint" aria-hidden />
        <input
          ref={input} id={id} role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
          required={required && !value}
          value={open ? query : chosen ? getText(chosen) : ''}
          placeholder={placeholder}
          onFocus={(e) => { setOpen(true); setActive(0); e.currentTarget.select(); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onKeyDown={onKey}
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-ink outline-none placeholder:text-ink-faint"
        />
        {chosen && !open ? (
          <button type="button" aria-label="Clear" onClick={() => { onChange(''); input.current?.focus(); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-sunken"><X size={15} /></button>
        ) : <ChevronDown size={16} className="shrink-0 text-ink-faint" aria-hidden />}
      </div>

      {open && (
        <ul id={listId} role="listbox" className="mt-1 max-h-72 overflow-y-auto rounded-lg border border-line bg-surface">
          {matches.map((item, i) => (
            <li key={getId(item)} id={`${listId}-${i}`} role="option" aria-selected={getId(item) === value}>
              <button
                type="button" tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(item)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${i === active ? 'bg-taupe/10' : ''}`}
              >
                {renderItem(item)}
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="px-3 py-4 text-center text-sm text-ink-muted">{emptyText}</li>}
        </ul>
      )}
    </div>
  );
}
