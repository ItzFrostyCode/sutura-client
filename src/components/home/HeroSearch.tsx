'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Loader2, Scissors, Search as SearchIcon, Store, X } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { formatAddress } from '@/lib/formatAddress';

const HISTORY_KEY = 'sutura:search-history';
const HISTORY_MAX = 8;
const SUGGEST_DELAY_MS = 250;

interface Suggestion {
  kind: 'service' | 'shop';
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
}

type Option = { type: 'history'; text: string } | { type: 'suggestion'; item: Suggestion };

// Browser storage can be blocked (private mode); history is a convenience only.
function readHistory(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string').slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}
function writeHistory(list: string[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX))); } catch { /* ignore */ }
}

/** "suit" in "Barong & Suit Rental" → Barong & <b>Suit</b> Rental */
function Highlight({ text, query }: { readonly text: string; readonly query: string }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-semibold text-ink">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * The home hero's search bar with a YouTube-style dropdown: recent searches
 * when it's empty, live service + shop suggestions while typing. Arrow keys
 * move through the list, Enter opens the highlighted row (or searches the
 * text), Esc or a click outside closes it.
 */
export default function HeroSearch({ value, onChange }: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  const query = value.trim();

  useEffect(() => { setHistory(readHistory()); }, []);

  // Live suggestions: services first (what people search for), then shops.
  useEffect(() => {
    setActive(-1);
    if (query.length < 2) { setSuggestions([]); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [services, shops] = await Promise.all([
          api.get('/public/services', { params: { q: query, per_page: 5 }, signal: controller.signal }),
          api.get('/public/stores', { params: { q: query, per_page: 4 }, signal: controller.signal }),
        ]);
        // One row per service: "BFP Uniform" over the shop that offers it,
        // opening that service inside its shop.
        const serviceRows: { id: number; name: string; image_url?: string | null; store?: { name: string; slug: string; logo_path?: string | null } | null }[] = services.data?.data ?? [];
        const serviceItems: Suggestion[] = serviceRows.map((s) => ({
          kind: 'service' as const,
          id: `service-${s.id}`,
          title: s.name,
          subtitle: s.store?.name ?? '',
          image: s.image_url ?? s.store?.logo_path ?? null,
          href: s.store ? `/store/${s.store.slug}/service/${s.id}` : `/search?q=${encodeURIComponent(s.name)}`,
        }));
        // A shop already shown under one of its services isn't listed again;
        // shops that match only by name or address still get their own row.
        const shownShops = new Set(serviceRows.map((s) => s.store?.slug).filter(Boolean));
        const shopList: { id: number; name: string; slug: string; logo_path?: string | null; branches?: { is_main?: boolean; address?: string | null; barangay?: string | null; district?: string | null; city?: string | null }[] }[] = shops.data?.data ?? [];
        const shopItems: Suggestion[] = shopList.filter((s) => !shownShops.has(s.slug)).slice(0, 4).map((s) => {
          const main = s.branches?.find((b) => b.is_main) ?? s.branches?.[0];
          return {
            kind: 'shop' as const,
            id: `shop-${s.id}`,
            title: s.name,
            subtitle: ['Tailoring Shop', main ? formatAddress(main) : null].filter(Boolean).join(' · '),
            image: s.logo_path ?? null,
            href: `/store/${s.slug}`,
          };
        });
        setSuggestions([...serviceItems, ...shopItems]);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, SUGGEST_DELAY_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  // Close on a click/tap outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const options: Option[] = query
    ? suggestions.map((item) => ({ type: 'suggestion', item }))
    : history.map((text) => ({ type: 'history', text }));

  const remember = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const next = [t, ...history.filter((h) => h.toLowerCase() !== t.toLowerCase())].slice(0, HISTORY_MAX);
    setHistory(next);
    writeHistory(next);
  };

  const searchFor = (text: string) => {
    const t = text.trim();
    remember(t);
    onChange(t);
    setOpen(false);
    router.push(t ? `/search?q=${encodeURIComponent(t)}` : '/search');
  };

  const choose = (option: Option) => {
    if (option.type === 'history') return searchFor(option.text);
    remember(query);
    setOpen(false);
    router.push(option.item.href);
  };

  const removeHistory = (text: string) => {
    const next = history.filter((h) => h !== text);
    setHistory(next);
    writeHistory(next);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!options.length) return;
      e.preventDefault();
      setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => {
        const next = i + step;
        if (next < -1) return options.length - 1;
        if (next >= options.length) return -1; // back to the typed text
        return next;
      });
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    } else if (e.key === 'Enter' && open && active >= 0 && options[active]) {
      e.preventDefault();
      choose(options[active]);
    }
  };

  const showPanel = open && (query ? query.length >= 2 : history.length > 0);
  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); searchFor(value); }}
      className="w-full max-w-2xl mx-auto text-left"
      role="search"
    >
      <div ref={wrapRef} className="relative">
        <div className="hero-search-glow flex items-center h-[52px] sm:h-[56px] w-full bg-white border border-white/40 focus-within:border-white rounded-none transition-all">
          <div className="pl-4 pr-1 flex items-center shrink-0">
            <SearchIcon size={18} className="text-taupe" aria-hidden="true" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
            aria-label="Search tailors, garments or specializations"
            placeholder="Search tailors, garments (e.g., Barong, Chiffon), or specializations..."
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent px-2 text-sm sm:text-base text-ink placeholder:text-ink-faint focus:outline-none font-normal h-full"
          />
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(true); inputRef.current?.focus(); }}
              aria-label="Clear search"
              className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-sunken hover:text-ink cursor-pointer"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
          <button
            type="submit"
            className="shrink-0 h-full px-5 sm:px-7 bg-ink hover:bg-black text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer flex items-center justify-center border-l border-line"
          >
            Search
          </button>
        </div>

        {showPanel && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-xl">
            {!query && <p className="px-4 pb-1 pt-1 text-xs font-medium text-ink-muted">Recent searches</p>}

            <ul id={listId} role="listbox" aria-label={query ? 'Suggestions' : 'Recent searches'} className="max-h-[60vh] overflow-y-auto">
              {options.map((option, i) => {
                const highlighted = i === active;
                const base = `flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left cursor-pointer ${highlighted ? 'bg-sunken' : 'hover:bg-sunken'}`;

                if (option.type === 'history') {
                  return (
                    <li key={`h-${option.text}`} id={optionId(i)} role="option" aria-selected={highlighted} className={`${base} group`}
                      onPointerDown={(e) => e.preventDefault()} onClick={() => choose(option)} onMouseEnter={() => setActive(i)}>
                      <Clock size={18} className="shrink-0 text-ink-muted" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{option.text}</span>
                      <button type="button" aria-label={`Remove ${option.text} from history`}
                        onClick={(e) => { e.stopPropagation(); removeHistory(option.text); }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-line hover:text-ink cursor-pointer">
                        <X size={15} aria-hidden="true" />
                      </button>
                    </li>
                  );
                }

                const { item } = option;
                return (
                  <li key={item.id} id={optionId(i)} role="option" aria-selected={highlighted} className={base}
                    onPointerDown={(e) => e.preventDefault()} onClick={() => choose(option)} onMouseEnter={() => setActive(i)}>
                    <SearchIcon size={18} className="shrink-0 text-ink-muted" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-ink-body"><Highlight text={item.title} query={query} /></span>
                      <span className="block truncate text-xs text-ink-muted">{item.subtitle}</span>
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sunken text-ink-faint">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getMediaUrl(item.image)} alt="" className="h-full w-full object-cover" />
                      ) : item.kind === 'shop' ? <Store size={16} aria-hidden="true" /> : <Scissors size={16} aria-hidden="true" />}
                    </span>
                  </li>
                );
              })}
            </ul>

            {query && loading && suggestions.length === 0 && (
              <p className="flex items-center gap-2 px-4 py-3 text-sm text-ink-muted"><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Searching…</p>
            )}
            {query && !loading && suggestions.length === 0 && (
              <p className="px-4 py-3 text-sm text-ink-muted">No matching services or shops. Press Enter to search everything for &ldquo;{query}&rdquo;.</p>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
