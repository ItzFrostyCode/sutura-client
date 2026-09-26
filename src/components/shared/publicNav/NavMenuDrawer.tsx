'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, User as UserIcon } from 'lucide-react';
import type { CategoryLeaf, MenuScreen, TopGroup } from './navTypes';
import { TOP_GROUPS } from './navData';
import { getCategoryColumns } from './navColumns';
import type { User } from '@/store/useAuthStore';
import { getMediaUrl } from '@/lib/media';

// A "category="/"specialization=" href (e.g. "Browse All Suits" ->
// ?category=suit) carries no human-readable text — the search box stayed
// on its placeholder after tapping one of these on mobile, even though
// results were correctly filtered, because nothing ever populated the
// input. Append the tapped label as a display-only `qlabel` param instead
// of `q` itself — `q` is a real free-text filter ANDed with the category
// filter on the backend, so setting it to "All Suits" would incorrectly
// exclude any suit whose name/description doesn't literally contain those
// words. `qlabel` only echoes into the search page's input display (see
// useSearchData) and is replaced the instant the customer actually types.
// Links that already carry their own `q` (e.g. "Bespoke Tuxedos" ->
// ?q=tuxedo) are left untouched.
function withQLabel(href: string, label: string): string {
  const [path, queryStr = ''] = href.split('?');
  const params = new URLSearchParams(queryStr);
  if (!params.has('q') && (params.has('category') || params.has('specialization'))) {
    params.set('qlabel', label);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

interface NavMenuDrawerProps {
  readonly isOpen: boolean;
  readonly screen: MenuScreen;
  readonly openSection: string;
  readonly onClose: () => void;
  readonly onGoBack: () => void;
  readonly onSelectGroup: (group: TopGroup) => void;
  readonly onOpenCategory: (group: TopGroup, category: CategoryLeaf) => void;
  readonly onToggleSection: (key: string) => void;
  readonly trackOrderHref?: string;
  readonly trackOrderLabel?: string;
  readonly accountHref?: string;
  readonly userDrawerLabel?: string;
  readonly user?: User | null;
  readonly isAuthenticated?: boolean;
}

export default function NavMenuDrawer({
  isOpen,
  screen,
  onClose,
  onGoBack,
  onSelectGroup,
  onOpenCategory,
  trackOrderHref = '/track',
  trackOrderLabel = 'Track Order',
  accountHref = '/account',
  userDrawerLabel,
  user = null,
  isAuthenticated = false,
}: NavMenuDrawerProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Auto-open first section when navigating to Level 2
  useEffect(() => {
    if (screen.level === 2) {
      const cols = getCategoryColumns(screen.group.key, screen.category);
      if (cols.length > 0) {
        setOpenSections(new Set([cols[0].title]));
      }
    } else if (screen.level === 1 && screen.group.key === 'discover') {
      const cols = getCategoryColumns('discover');
      if (cols.length > 0) {
        setOpenSections(new Set([cols[0].title]));
      }
    }
  }, [screen.level, screen.level === 2 ? screen.category.label : '']);

  if (!isOpen) return null;

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const level2Cols = screen.level === 2 ? getCategoryColumns(screen.group.key, screen.category) : [];
  const discoverCols = screen.level === 1 && screen.group.key === 'discover' ? getCategoryColumns('discover') : [];

  return (
    <div
      data-public-nav-menu
      className="fixed inset-0 top-[52px] sm:top-[64px] z-50 bg-white text-black flex flex-col overscroll-contain shadow-2xl animate-in fade-in-0 duration-150 max-w-[599px] mx-auto border-x border-gray-200"
    >
      {/* Submenu Top Bar with Back Button & Breadcrumb */}
      {screen.level > 0 && (
        <div className="flex items-center justify-between px-4 h-[52px] bg-gray-50 border-b border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onGoBack}
            className="flex items-center gap-1.5 text-black cursor-pointer hover:opacity-70 transition-opacity h-full px-1"
          >
            <ChevronLeft size={18} />
            <span className="text-[12px] font-bold uppercase tracking-wider">
              {screen.level === 2 ? screen.group.label : 'Menu'}
            </span>
          </button>
          <span className="text-[12px] font-extrabold uppercase tracking-widest text-black">
            {screen.level === 2 ? screen.category.label : screen.level === 1 ? screen.group.label : ''}
          </span>
          <div className="w-10" />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto overscroll-contain bg-white divide-y divide-gray-100">
        {/* LEVEL 0: Top Level Categories */}
        {screen.level === 0 && (
          <>
            {TOP_GROUPS.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => onSelectGroup(group)}
                className="w-full h-[56px] px-6 flex items-center justify-between text-black cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
              >
                <span className="text-[13px] font-bold uppercase tracking-wider text-black">
                  {group.label}
                </span>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            ))}

            {/* Track Order: routes to /account/orders for Customers, /track for Guests */}
            <Link
              href={trackOrderHref}
              onClick={onClose}
              className="w-full h-[56px] px-6 flex items-center justify-between text-black hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <span className="text-[13px] font-bold uppercase tracking-wider text-black">
                {trackOrderLabel}
              </span>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>

            {/* User Account / Sign In: Customer profile vs Guest account */}
            <Link
              href={accountHref}
              onClick={onClose}
              className="w-full h-[56px] px-6 flex items-center justify-between text-black hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-2.5">
                {isAuthenticated && user ? (
                  user.profile_picture ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-200">
                      <Image
                        src={getMediaUrl(user.profile_picture)}
                        alt={user.name || 'Account'}
                        fill
                        sizes="24px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-taupe text-white text-[11px] font-bold flex items-center justify-center">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )
                ) : (
                  <UserIcon size={17} className="text-gray-500" />
                )}
                <span className="text-[13px] font-bold uppercase tracking-wider text-black">
                  {userDrawerLabel ?? (isAuthenticated ? 'My Account' : 'Sign In / Register')}
                </span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          </>
        )}

        {/* LEVEL 1: Discover Sections Accordions */}
        {screen.level === 1 && screen.group.key === 'discover' && (
          <div>
            {discoverCols.map((col) => {
              const isOpen = openSections.has(col.title);
              return (
                <div key={col.title} className="border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => toggleSection(col.title)}
                    className="w-full h-[52px] px-6 flex items-center justify-between text-black cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <span className="text-[12px] font-bold uppercase tracking-wider text-black">
                      {col.title}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-black" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="bg-gray-50/70 py-1 border-t border-gray-100">
                      {col.items.map((item) => (
                        <Link
                          key={item.label}
                          href={withQLabel(item.href, item.label)}
                          onClick={onClose}
                          className="flex items-center px-8 h-[48px] text-[13px] font-normal text-gray-700 hover:text-black active:bg-gray-200/50 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* LEVEL 1: Category Drilldowns (Men, Women, Wedding, Office) */}
        {screen.level === 1 && screen.group.key !== 'discover' && (
          <>
            {screen.group.categories.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => onOpenCategory(screen.group, category)}
                className="w-full h-[54px] px-6 flex items-center justify-between text-black cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
              >
                <span className="text-[13px] font-medium text-black">{category.label}</span>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            ))}
          </>
        )}

        {/* LEVEL 2: Columns / Accordions (FEATURED, COLLECTIONS, STYLES, etc.) */}
        {screen.level === 2 && (
          <div>
            {level2Cols.map((col) => {
              const isOpen = openSections.has(col.title);
              return (
                <div key={col.title} className="border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => toggleSection(col.title)}
                    className="w-full h-[52px] px-6 flex items-center justify-between text-black cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <span className="text-[12px] font-bold uppercase tracking-wider text-black">
                      {col.title}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-black" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="bg-gray-50/70 py-1 border-t border-gray-100">
                      {(col.title.toUpperCase().includes('COLOR') || col.items.some((i) => !!i.hex)) ? (
                        <div className="flex flex-wrap gap-2 px-6 py-3">
                          {col.items.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={onClose}
                              title={item.label}
                              aria-label={item.label}
                              className="group relative w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform"
                            >
                              <span
                                className="w-6 h-6 rounded-full block border border-black/20 shadow-2xs transition-all active:scale-95"
                                style={{ backgroundColor: item.hex || '#111827' }}
                              />
                            </Link>
                          ))}
                        </div>
                      ) : (
                        col.items.map((item) => (
                          <Link
                            key={item.label}
                            href={withQLabel(item.href, item.label)}
                            onClick={onClose}
                            className="flex items-center px-8 h-[48px] text-[13px] font-normal text-gray-700 hover:text-black active:bg-gray-200/50 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer CTA */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        <Link
          href="/stores"
          onClick={onClose}
          className="w-full h-[52px] bg-black hover:bg-black/90 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center transition-colors active:scale-[0.99] cursor-pointer"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          Explore All Stores
        </Link>
      </div>
    </div>
  );
}
