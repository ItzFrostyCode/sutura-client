'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TOP_GROUPS } from './navData';
import type { CategoryLeaf } from './navTypes';

import { getCategoryColumns, type NavColumn } from './navColumns';
import { DEPARTMENT_KEY_MAP } from './navColorColumn';

// Next 16.3 requires useSearchParams() to sit inside a Suspense boundary at
// build time (pre-existing gap, not introduced by this change — same fix
// pattern already applied to reset-password/page.tsx and
// print/jobs/[id]/receipt/page.tsx). Fixed here only because it otherwise
// blocks `npm run build` entirely (WebHoverNav renders via PublicNav on most
// customer-facing pages), which this session's own validation step requires.
export default function WebHoverNav() {
  return (
    <Suspense fallback={null}>
      <WebHoverNavInner />
    </Suspense>
  );
}

function WebHoverNavInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // A header category link is a bare "/search?category=X" or "/search?q=X"
  // href — following it normally would wipe out whatever the customer
  // already had going on /search (their typed query, district, color,
  // rating, etc.) AND wouldn't tell /search's Department selector which
  // top group (Men/Women/Wedding/Office) it came from, since category
  // values like "suit" or "gown" belong to more than one department.
  // Already on /search, merge the new param(s) — plus the resolved
  // department — into the current URL instead of replacing it outright;
  // elsewhere, still intercept so the department tag rides along to a
  // fresh /search visit too.
  const handleCategoryLinkClick = (e: React.MouseEvent, href?: string, groupKey?: string, label?: string) => {
    setActiveGroupKey(null);
    if (!href || !href.startsWith('/search')) return;
    const department = groupKey ? DEPARTMENT_KEY_MAP[groupKey] : undefined;
    if (pathname !== '/search' && !department) return;
    e.preventDefault();
    const queryStr = href.split('?')[1] ?? '';
    const incoming = new URLSearchParams(queryStr);
    if (department) incoming.set('department', department);
    // A "category="/"specialization=" href (e.g. "Browse All Suits" ->
    // ?category=suit) carries no human-readable text — the search box
    // stayed on its placeholder after clicking one of these, even though
    // results were correctly filtered, because nothing ever populated the
    // input. Carry the clicked label as a separate `qlabel` display-only
    // param instead of stuffing it into `q` itself — `q` is a real
    // free-text filter ANDed with the category filter on the backend, so
    // setting it to "All Suits" would incorrectly exclude any suit whose
    // name/description doesn't literally contain those words. `qlabel`
    // only echoes into the input's placeholder-like display (see
    // useSearchData/search page) and is replaced the instant the customer
    // actually types. Links that already carry their own `q` (e.g.
    // "Bespoke Tuxedos" -> ?q=tuxedo) are untouched.
    if (label && !incoming.has('q') && (incoming.has('category') || incoming.has('specialization'))) {
      incoming.set('qlabel', label);
    }
    const merged = pathname === '/search' ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    if (incoming.has('category') || incoming.has('specialization') || incoming.has('q')) {
      merged.delete('q');
      merged.delete('search');
      merged.delete('category');
      merged.delete('specialization');
      merged.delete('qlabel');
    }
    incoming.forEach((value, key) => merged.set(key, value));
    router.push(`/search?${merged.toString()}`);
  };

  const clearPendingClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseEnter = (key: string) => {
    clearPendingClose();
    if (activeGroupKey !== key) {
      setActiveGroupKey(key);
      setActiveCategoryIndex(0);
    }
  };

  const handleGroupClick = (key: string) => {
    if (activeGroupKey === key) {
      setActiveGroupKey(null);
    } else {
      setActiveGroupKey(key);
      setActiveCategoryIndex(0);
    }
  };

  const handleMouseLeave = () => {
    clearPendingClose();
    timeoutRef.current = setTimeout(() => {
      setActiveGroupKey(null);
    }, 180);
  };

  useEffect(() => {
    return () => {
      clearPendingClose();
    };
  }, []);

  useEffect(() => {
    setActiveGroupKey(null);
  }, [pathname]);

  const activeGroup = TOP_GROUPS.find((g) => g.key === activeGroupKey);
  const currentCat = activeGroup?.categories?.[activeCategoryIndex] ?? activeGroup?.categories?.[0];
  const columns = activeGroup ? getCategoryColumns(activeGroup.key, currentCat) : [];

  return (
    <div
      className="hidden lg:flex items-center"
      onMouseLeave={handleMouseLeave}
    >
      {/* Top Nav Items on the LEFT (MEN, WOMEN, WEDDING, OFFICE, DISCOVER) */}
      <nav className="flex items-center gap-5 lg:gap-7" aria-label="Main menu">
        {TOP_GROUPS.map((group) => {
          const isCurrent = activeGroupKey === group.key;
          return (
            <div
              key={group.key}
              className="relative py-4"
              onMouseEnter={() => handleMouseEnter(group.key)}
            >
              <button
                type="button"
                onClick={() => handleGroupClick(group.key)}
                className={`text-[12px] lg:text-[13px] font-semibold tracking-wider transition-colors cursor-pointer uppercase whitespace-nowrap ${
                  isCurrent
                    ? 'text-ink font-bold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {group.label}
              </button>

              {/* Active Underline */}
              {isCurrent && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink" />
              )}
            </div>
          );
        })}
      </nav>

      {/* WHITE BACKGROUND MEGA-MENU ON HOVER/CLICK (Anti-AI slop: clean typography, 0 box corner radius) */}
      {activeGroup && (
        <div
          className="fixed left-0 right-0 top-[52px] sm:top-[64px] bg-white border-b border-gray-200 shadow-xl z-50 text-black animate-in fade-in-0 duration-150"
          onMouseEnter={() => handleMouseEnter(activeGroup.key)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            {/* ROW 2: CATEGORY ROW (SUITS, TUXEDOS, SHIRTS, BLAZERS, PANTS...) */}
            {activeGroup.categories.length > 0 && (
              <div className="flex items-center gap-6 lg:gap-8 overflow-x-auto hide-scrollbar border-b border-gray-200">
                {activeGroup.categories.map((cat, idx) => {
                  const isSelected = activeCategoryIndex === idx;
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setActiveCategoryIndex(idx)}
                      onMouseEnter={() => setActiveCategoryIndex(idx)}
                      className={`relative py-3.5 text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                        isSelected ? 'text-black font-extrabold' : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {isSelected && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ROW 3: CLEAN TYPOGRAPHIC COLUMNS (NO BOXES, NO CORNER RADIUS, VERTICAL DIVIDERS) */}
            <div className="flex pt-6 pb-7">
              {columns.map((col, idx) => {
                const isColorCol = col.title.toUpperCase().includes('COLOR') || col.items.some((i) => !!i.hex);
                return (
                    <div
                      key={col.title}
                      className={`w-60 shrink-0 ${
                        idx === 0
                          ? 'pr-10'
                          : idx === columns.length - 1
                          ? 'pl-10'
                          : 'px-10'
                      } ${idx !== columns.length - 1 ? 'border-r border-gray-200' : ''}`}
                    >
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-black mb-4">
                        {col.title}
                      </h4>
                      {isColorCol ? (
                        <div className="flex flex-wrap gap-2 max-w-[180px] pt-1">
                          {col.items.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={(e) => handleCategoryLinkClick(e, item.href, activeGroup?.key)}
                              title={item.label}
                              aria-label={item.label}
                              className="group relative p-0.5 rounded-full transition-transform hover:scale-120 active:scale-95 focus:outline-none"
                            >
                              <span
                                className="w-5 h-5 rounded-full block border border-black/20 shadow-2xs transition-all group-hover:border-black/60 group-hover:shadow-xs"
                                style={{ backgroundColor: item.hex || '#111827' }}
                              />
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-2.5">
                          {col.items.map((item) => (
                            <li key={item.label}>
                              <Link
                                href={item.href}
                                onClick={(e) => handleCategoryLinkClick(e, item.href, activeGroup?.key, item.label)}
                                className="text-[13px] text-gray-700 hover:text-black hover:underline transition-colors block leading-relaxed"
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
