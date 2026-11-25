'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X, Loader2 } from 'lucide-react';

type PanelPos = { left: number; width: number; top?: number; bottom?: number; listMax: number };
const GAP = 6;
const EDGE = 12;
// Search box + its hint row, so the list's max height leaves room for them.
const SEARCH_BLOCK = 92;

export interface ComboboxOption<T = unknown> {
  id: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  price?: string;
  icon?: React.ElementType;
  imageUrl?: string | null;
  raw?: T;
}

interface SearchableComboboxProps<T = unknown> {
  readonly items: ComboboxOption<T>[];
  readonly value: string | number;
  readonly onChange: (value: string | number, item?: ComboboxOption<T>) => void;
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly emptyMessage?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly className?: string;
  readonly onSearchChange?: (query: string) => void;
  readonly autoHighlightFirst?: boolean;
  readonly allowClear?: boolean;
  readonly rightAction?: React.ReactNode;
  /** Show the sublabel on the same line, muted, as "Label — sublabel" (e.g. a customer and their number). */
  readonly inlineSublabel?: boolean;
  /** Id for the trigger, so a <label htmlFor> can point at it. */
  readonly id?: string;
}

export default function SearchableCombobox<T = unknown>({
  items,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  emptyMessage = 'No matching options found',
  required = false,
  disabled = false,
  loading = false,
  className = '',
  onSearchChange,
  autoHighlightFirst = true,
  allowClear = true,
  rightAction,
  inlineSublabel = false,
  id,
}: SearchableComboboxProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // The panel is portalled to <body> with fixed positioning, so a modal's
  // scrolling body (overflow) can't clip it. It sits under the field, or
  // flips above when there's more room there, and follows scroll/resize.
  const [pos, setPos] = useState<PanelPos | null>(null);
  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const width = Math.max(r.width, Math.min(280, window.innerWidth - EDGE * 2));
    const left = Math.min(r.left, window.innerWidth - width - EDGE);
    const up = below < 260 && above > below;
    const listMax = Math.max(120, Math.min(240, (up ? above : below) - SEARCH_BLOCK));
    setPos(up ? { left, width, bottom: vh - r.top + GAP, listMax } : { left, width, top: r.bottom + GAP, listMax });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [isOpen, place]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return items.find(item => String(item.id) === String(value));
  }, [items, value]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      const matchLabel = item.label.toLowerCase().includes(q);
      const matchSub = item.sublabel ? item.sublabel.toLowerCase().includes(q) : false;
      const matchBadge = item.badge ? item.badge.toLowerCase().includes(q) : false;
      return matchLabel || matchSub || matchBadge;
    });
  }, [items, searchQuery]);

  // Auto-highlight first item whenever search results change
  useEffect(() => {
    if (autoHighlightFirst && filteredItems.length > 0) {
      setHighlightedIndex(0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [filteredItems, autoHighlightFirst]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(t) && !panelRef.current?.contains(t)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1 < filteredItems.length ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
          const item = filteredItems[highlightedIndex];
          onChange(item.id, item);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        // Close just the list, not the modal it sits in.
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  }, [isOpen, filteredItems, highlightedIndex, onChange]);

  // Ensure highlighted element is visible in view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (item: ComboboxOption<T>) => {
    onChange(item.id, item);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <div
        ref={triggerRef}
        id={id}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 bg-canvas border rounded-xl px-3.5 py-2.5 text-sm transition-all select-none cursor-pointer ${
          disabled
            ? 'opacity-60 cursor-not-allowed border-line bg-canvas/60 text-ink-muted'
            : isOpen
            ? 'border-taupe ring-2 ring-taupe/20 bg-surface shadow-xs'
            : 'border-line hover:border-taupe/60 text-ink'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption ? (
            <>
              {selectedOption.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedOption.imageUrl}
                  alt={selectedOption.label}
                  className="w-6 h-6 rounded-md object-cover border border-line shrink-0"
                />
              ) : selectedOption.icon ? (
                <selectedOption.icon size={15} className="text-taupe shrink-0" />
              ) : null}

              <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="font-semibold text-ink truncate text-xs sm:text-sm">
                    {selectedOption.label}
                  </span>
                  {selectedOption.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                      selectedOption.badgeColor || 'bg-canvas text-ink-muted border border-line'
                    }`}>
                      {selectedOption.badge}
                    </span>
                  )}
                  {selectedOption.sublabel && (
                    <span className={`text-ink-muted truncate tabular-nums ${inlineSublabel ? 'text-xs sm:text-sm' : 'text-xs hidden md:inline'}`}>
                      {inlineSublabel ? '— ' : '• '}{selectedOption.sublabel}
                    </span>
                  )}
                </div>

                {selectedOption.price && (
                  <span className="shrink-0 font-mono font-bold text-xs text-ink bg-surface border border-line px-2 py-0.5 rounded-md shadow-2xs">
                    {selectedOption.price}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-ink-muted/80 text-xs sm:text-sm truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {loading && <Loader2 size={14} className="animate-spin text-taupe" />}

          {allowClear && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              className="p-1 rounded-full text-ink-muted hover:text-danger hover:bg-canvas transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          )}

          {rightAction && (
            <div onClick={e => e.stopPropagation()} className="ml-1">
              {rightAction}
            </div>
          )}

          <ChevronDown
            size={14}
            className={`text-ink-muted transition-transform duration-150 ${isOpen ? 'rotate-180 text-taupe' : ''}`}
          />
        </div>
      </div>

      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          readOnly
          tabIndex={-1}
          required={required}
          value={value ? String(value) : ''}
          className="sr-only"
        />
      )}

      {/* Dropdown Menu Popover */}
      {isOpen && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="fixed z-90 bg-surface border border-line rounded-2xl shadow-[0_12px_32px_-8px_rgba(45,42,38,0.22)] overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
        >
          {/* Integrated Search Bar */}
          <div className="p-2.5 border-b border-line bg-canvas/30">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-ink-muted pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  onSearchChange?.(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full bg-surface border border-line focus:border-taupe focus:ring-2 focus:ring-taupe/15 rounded-xl pl-8.5 pr-8 py-2 text-xs sm:text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 text-ink-muted hover:text-ink p-0.5 rounded-full"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            {searchQuery && filteredItems.length > 0 && (
              <div className="flex items-center justify-between text-[10px] text-ink-muted mt-1.5 px-1 font-medium">
                <span>Press Enter to select 1st result</span>
                <span className="tabular-nums">{filteredItems.length} found</span>
              </div>
            )}
          </div>

          {/* Smooth Scrollable Options List */}
          {/* Inline mode: the padded frame holds the scrolling list, so the
              scrollbar sits inset (10px top/bottom, 4px right) and never
              runs into the card's rounded corners. */}
          <div className={inlineSublabel ? 'py-2.5 pl-2.5 pr-1' : ''}>
          <ul
            ref={listRef}
            role="listbox"
            style={{ maxHeight: inlineSublabel ? pos.listMax - 20 : pos.listMax }}
            className={`overflow-y-auto slim-scrollbar ${inlineSublabel ? 'pr-1.5 scrollbar-gutter-stable space-y-0.5' : 'py-1 divide-y divide-line/30'}`}
          >
            {filteredItems.length === 0 ? (
              <li className="px-4 py-8 text-center text-xs text-ink-muted space-y-2">
                <p className="font-medium">{emptyMessage}</p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      inputRef.current?.focus();
                    }}
                    className="text-taupe hover:underline font-bold text-[11px]"
                  >
                    Clear search query
                  </button>
                )}
              </li>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = String(item.id) === String(value);
                const isHighlighted = idx === highlightedIndex;
                const Icon = item.icon;

                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 text-xs sm:text-sm cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      inlineSublabel
                        ? `rounded-lg text-ink ${isSelected ? 'bg-[#F3EBDD]' : isHighlighted ? 'bg-[#F8F3EC]' : ''}`
                        : isHighlighted
                        ? 'bg-taupe/10 text-ink'
                        : isSelected
                        ? 'bg-canvas text-ink'
                        : 'text-ink hover:bg-canvas/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.label}
                          className="w-8 h-8 rounded-lg object-cover border border-line shrink-0"
                        />
                      ) : Icon ? (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-taupe text-white' : 'bg-canvas text-ink-muted border border-line'
                        }`}>
                          <Icon size={15} />
                        </div>
                      ) : null}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {inlineSublabel ? (
                            <span className="truncate leading-snug">
                              <span className={isSelected ? 'font-semibold' : 'font-medium'}>{item.label}</span>
                              {item.sublabel && <span className="text-ink-muted tabular-nums"> — {item.sublabel}</span>}
                            </span>
                          ) : (
                            <span className={`truncate leading-snug ${isSelected || isHighlighted ? 'font-bold' : 'font-medium'}`}>
                              {item.label}
                            </span>
                          )}
                          {item.badge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              item.badgeColor || 'bg-canvas text-ink-muted border border-line'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.sublabel && !inlineSublabel && (
                          <p className="text-[11px] text-ink-muted truncate mt-0.5">
                            {item.sublabel}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.price && (
                        <span className="font-mono font-bold text-xs text-ink bg-surface border border-line px-2 py-0.5 rounded-md shadow-2xs">
                          {item.price}
                        </span>
                      )}
                      {isSelected && inlineSublabel && <Check size={16} className="text-ink" aria-hidden="true" />}
                      {isSelected && !inlineSublabel && (
                        <span className="w-5 h-5 rounded-full bg-taupe/15 text-taupe flex items-center justify-center">
                          <Check size={13} className="font-bold stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
