'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, Bell, User, ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { CATEGORY_CHIP_SETS } from '@/lib/categoryChipSets';

// A leaf category links one of two ways: `garmentType` when a real
// catalog_items.garment_type enum value exists for it (Gown, Filipiniana,
// Barong, Suit, Uniform), or `query` (a plain /search?q= text search) when
// it doesn't — "Tuxedos"/"Blazers"/"Casual Wear" etc. are real reference
// labels the user wants shown verbatim, but there's no matching enum
// value, so they search item names instead. Either way the link is real
// and functional, never decorative.
//
// `sections`, when present, replaces the standard Explore/Price
// Range/District/Color accordion entirely with a custom one — needed for
// Wedding/Office's Men & Women, which each have their own distinct
// section set (Wedding Role, Dress Code, Office Essentials, …) straight
// from the reference, not the generic template every other leaf uses.
interface AccordionItem {
  label: string;
  /** Real, functional destination. Absent = static/decorative (no data or
   * filter exists for it yet — same treatment as the Color swatches). */
  href?: string;
  /** Only read when the owning section has `swatches: true`. */
  hex?: string;
}
interface AccordionSectionDef {
  key: string;
  label: string;
  swatches?: boolean;
  /** No accordion header/toggle — just a plain vertical list of full-size
   * rows, matching the reference's flat "All Suits / Clearance Suits /
   * …" dropdown (not a grouped Featured/Collections/Color breakdown). */
  flat?: boolean;
  items: AccordionItem[];
}
interface CategoryLeaf {
  label: string;
  garmentType?: string;
  query?: string;
  sections?: AccordionSectionDef[];
}

// Converts a shared CATEGORY_CHIP_SETS entry (also used by /search's
// horizontal chip carousel) into a single flat section, so tapping "Suits"
// here shows the exact same options as a vertical "< Suits" list instead
// of jumping straight to /search. A chip with no `q` (Clearance/Wedding/
// Premium/Luxury/New) has no `href` — same static treatment as Wedding
// Role — but /search's own carousel still lets you tap it (falls back to
// the base search), so this list doesn't need its own fallback logic.
function chipSetSection(key: keyof typeof CATEGORY_CHIP_SETS): AccordionSectionDef[] {
  const set = CATEGORY_CHIP_SETS[key];
  return [{
    key: 'flat',
    label: set.title,
    flat: true,
    items: set.chips.map((c) => ({
      label: c.label,
      href: c.q ? `/search?q=${encodeURIComponent(c.q)}` : undefined,
    })),
  }];
}

// Root level matches the reference exactly: Men / Women / Wedding / Office
// / Discover — not a fabricated "Shop by Occasion" wrapper. Discover isn't
// category-based at all — like the reference's own "Discover" (How it
// Works / Showrooms & Appointments / Our Story), it's a flat list of
// direct links: this is where Browse Map/My Account/Register a Shop/About
// Sutura and Alterations & Repairs now live, instead of sitting at the root.
interface TopGroup {
  key: string;
  label: string;
  categories: CategoryLeaf[];
  links?: { href: string; label: string }[];
}
// Wedding and Office's Men/Women each carry their own `sections` — a
// distinct facet set per the reference (Wedding Role / Dress Code /
// Finishing Touches for Wedding; Office Dress Code / Office Essentials /
// Colors for Office), not the standard Explore/Price Range/District/Color
// template every other leaf uses. Role/Dress-Code items have no `href` —
// no such filter/data exists — same static treatment as Color elsewhere.
const WEDDING_MEN_SECTIONS: AccordionSectionDef[] = [
  { key: 'featured', label: 'Featured', items: [
    { label: 'Browse All Wedding Suits', href: '/search?category=suit' },
  ] },
  { key: 'role', label: 'Wedding Role', items: [
    { label: 'Groom' }, { label: 'Groomsmen' }, { label: 'Guest' }, { label: 'Father of the Bride' },
  ] },
  { key: 'dresscode', label: 'Dress Code', items: [
    { label: 'Black Tie' }, { label: 'Classic & Traditional' }, { label: 'Summer & Destination' },
    { label: 'Rustic & Autumn' }, { label: 'Winter & Festive Formal' },
  ] },
  { key: 'finishing', label: 'Finishing Touches', items: [
    { label: 'Tuxedo Shirts', href: '/search?q=tuxedo' },
    { label: 'Dress Shirts', href: '/search?q=shirt' },
    { label: 'Ties', href: '/search?q=tie' },
    { label: 'Pocket Squares', href: '/search?q=pocket' },
    { label: 'Cufflinks', href: '/search?q=cufflink' },
  ] },
];
const WEDDING_WOMEN_SECTIONS: AccordionSectionDef[] = [
  { key: 'featured', label: 'Featured', items: [
    { label: 'Browse All Wedding Gowns', href: '/search?category=gown' },
  ] },
  { key: 'role', label: 'Wedding Role', items: [
    { label: 'Bride' }, { label: 'Bridal Party' }, { label: 'Wedding Guest' }, { label: 'Mother of the Groom' },
  ] },
  { key: 'dresscode', label: 'Dress Code', items: [
    { label: 'Black Tie' }, { label: 'Modern & Minimalist' }, { label: 'Classic & Traditional' },
    { label: 'Summer & Destination' }, { label: 'Rustic & Autumn' }, { label: 'Winter & Festive Formal' },
  ] },
  { key: 'finishing', label: 'Finishing Touches', items: [
    { label: 'Wedding Shirts', href: '/search?q=shirt' },
    { label: 'Pocket Squares', href: '/search?q=pocket' },
    { label: 'Scarves', href: '/search?q=scarf' },
  ] },
];

const TOP_GROUPS: TopGroup[] = [
  {
    key: 'men',
    label: 'Men',
    categories: [
      { label: 'Suits', sections: chipSetSection('suit') },
      { label: 'Tuxedos', sections: chipSetSection('tuxedo') },
      { label: 'Shirts', sections: chipSetSection('shirt') },
      { label: 'Blazers', sections: chipSetSection('blazer') },
      { label: 'Pants', sections: chipSetSection('pant') },
      { label: 'Casual Wear', query: 'casual' },
      { label: 'Outerwear', sections: chipSetSection('jacket') },
      { label: 'Accessories', sections: chipSetSection('accessories') },
      { label: 'Barong', garmentType: 'barong' },
    ],
  },
  {
    key: 'women',
    label: 'Women',
    categories: [
      { label: 'Suits', sections: chipSetSection('suit') },
      { label: 'Blazers', sections: chipSetSection('blazer') },
      { label: 'Pants', sections: chipSetSection('pant') },
      { label: 'Filipiniana', garmentType: 'filipiniana' },
    ],
  },
  {
    key: 'wedding',
    label: 'Wedding',
    categories: [
      { label: 'Men', sections: WEDDING_MEN_SECTIONS },
      { label: 'Women', sections: WEDDING_WOMEN_SECTIONS },
    ],
  },
  {
    key: 'corporate_teams',
    label: 'Corporate & Teams',
    // Office was removed per explicit direction (felt like corporate/
    // private territory) — this is now the only corporate-adjacent root
    // item, bulk/team orders rather than office attire, using
    // the standard accordion since no custom section content was given.
    categories: [
      { label: 'Team Jerseys', sections: chipSetSection('jersey') },
      { label: 'Corporate Uniforms', garmentType: 'uniform' },
    ],
  },
  {
    key: 'discover',
    label: 'Discover',
    categories: [],
    links: [
      { href: '/map', label: 'Browse Map' },
      // href is resolved dynamically in the render via accountHref; this
      // placeholder keeps the item in the list — the Link below overrides it.
      { href: '/account', label: 'My Account' },
      { href: '/register', label: 'Register a Shop' },
      { href: '/#about', label: 'About Sutura' },
      { href: '/search?q=alteration', label: 'Alterations & Repairs' },
    ],
  },
];

type MenuScreen =
  | { level: 0 }
  | { level: 1; group: TopGroup }
  | { level: 2; group: TopGroup; category: CategoryLeaf };

// A plain leaf (no `sections`) goes straight to /search, filtered — Price
// Range/District/Color refinement lives on /search's own filter panel
// (opened via its filter icon), not duplicated here.
function leafSearchHref(leaf: CategoryLeaf) {
  const params = new URLSearchParams();
  if (leaf.garmentType) params.set('category', leaf.garmentType);
  else if (leaf.query) params.set('q', leaf.query);
  return `/search?${params.toString()}`;
}

/**
 * Shared header for every public page except /search (which owns its own
 * back+location+search header — see search/page.tsx) and /account/* (which
 * doesn't render this at all — see account/layout.tsx).
 *
 * Layout: hamburger (left) — "SUTURA" wordmark (center) — Search,
 * Notification, and Me icons (right, no gap, per explicit direction).
 * Tapping the hamburger morphs it into an X in place and opens a
 * full-width menu panel below this header (the header itself stays
 * mounted/visible throughout). The panel is a real multi-level drill-down
 * (Men/Women/Wedding/Corporate & Teams/Discover → garment category →
 * accordion), not
 * a flat list — a single `screen` discriminated union (by `level`) tracks
 * depth, each carrying enough of its parent's data (e.g. level 2 keeps its
 * `group`) to reconstruct the previous screen when the back chevron is
 * tapped, matching the reference's "< Men" style navigation. Resets to
 * the root screen every time the menu closes, so reopening it doesn't
 * strand the visitor mid-drill-down.
 *
 * MobileBottomNav (Home/Map/Notification/Me) was removed entirely, per
 * explicit direction — all four destinations are still reachable: Home via
 * the wordmark link, Map via Discover, Notification and Me now live in the
 * header. The Notification bell keeps the same unread-badge fetch
 * MobileBottomNav used to do (`/notifications`, `unread_count`).
 *
 * The footer's "Search Shops" (→ /map, not /search — see the button's own
 * comment) and "Track Your Production" (→ /track) buttons stay visible at
 * every drill-down depth, matching how the reference keeps its own footer
 * CTA present across all menu levels.
 */
export default function PublicNav({ hideMenu = false }: { readonly hideMenu?: boolean } = {}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [screen, setScreen] = useState<MenuScreen>({ level: 0 });
  const [openSection, setOpenSection] = useState('explore');
  const { isAuthenticated, user } = useAuthStore();

  // Non-customer roles (owners, staff, admins) have no business on /account —
  // the layout guard would silently redirect them to /dashboard anyway. Skip
  // that extra hop by going there directly from the icon.
  const NON_CUSTOMER_ROLES = new Set(['shop_owner', 'staff', 'branch_manager', 'admin']);
  const isNonCustomer = user?.roles?.some((r) => NON_CUSTOMER_ROLES.has(r.name)) ?? false;
  const accountHref = isAuthenticated && isNonCustomer ? '/dashboard' : '/account';
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    api.get('/notifications')
      .then((res) => setUnreadCount(typeof res.data.unread_count === 'number' ? res.data.unread_count : 0))
      .catch(() => setUnreadCount(0));
  }, [isAuthenticated]);

  // Lock background scroll when the menu panel is open, preventing scroll chaining / leak to the underlying page
  useEffect(() => {
    if (!menuOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const scrollContainers = Array.from(document.querySelectorAll<HTMLElement>('.overflow-y-auto, .overflow-x-hidden'));
    const prevStyles = new Map<HTMLElement, string>();
    scrollContainers.forEach((el) => {
      if (!el.closest('[data-public-nav-menu]')) {
        prevStyles.set(el, el.style.overflowY);
        el.style.overflowY = 'hidden';
      }
    });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      prevStyles.forEach((val, el) => {
        el.style.overflowY = val;
      });
    };
  }, [menuOpen]);

  function toggleMenu() {
    setMenuOpen((open) => !open);
    setScreen({ level: 0 });
  }

  function closeMenu() {
    setMenuOpen(false);
    setScreen({ level: 0 });
  }

  function goBack() {
    if (screen.level === 2) setScreen({ level: 1, group: screen.group });
    else if (screen.level === 1) setScreen({ level: 0 });
  }

  function openCategory(group: TopGroup, category: CategoryLeaf) {
    setOpenSection(category.sections ? category.sections[0].key : 'explore');
    setScreen({ level: 2, group, category });
  }

  function toggleSection(key: string) {
    setOpenSection((cur) => (cur === key ? '' : key));
  }

  return (
    <header className="sticky top-0 z-50 w-full shrink-0">
      <div className="h-[50px] bg-taupe px-3 flex items-center relative">
        {/* Hamburger — absolute so it doesn't shift the SUTURA wordmark */}
        {!hideMenu ? (
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="absolute left-1 shrink-0 w-8 h-8 flex items-center justify-center text-white active:opacity-80 transition-opacity"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        ) : null}

        {/* SUTURA wordmark — no extra padding when hamburger is hidden (landing page) */}
        {!menuOpen && (
          <Link href="/" onClick={closeMenu} className={`shrink-0 ${!hideMenu ? 'pl-9' : ''}`}>
            <span className="text-[18px] font-serif font-bold text-white tracking-wide leading-none">
              SUTURA
            </span>
          </Link>
        )}

        {/* flex-1 spacer pushes right icons to the right */}
        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { closeMenu(); router.push('/search'); }}
            aria-label="Search"
            className="shrink-0 w-7 h-7 flex items-center justify-center text-white active:opacity-80 transition-opacity"
          >
            <Search size={19} />
          </button>
          <Link
            href="/notifications"
            aria-label="Notifications"
            onClick={closeMenu}
            className="relative shrink-0 w-7 h-7 flex items-center justify-center text-white active:opacity-80 transition-opacity"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-[#E41E3F] text-white text-[8px] font-bold rounded-full border border-taupe">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href={accountHref}
            aria-label="Me"
            onClick={closeMenu}
            className="shrink-0 w-7 h-7 flex items-center justify-center text-white active:opacity-80 transition-opacity"
          >
            <User size={19} />
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div
          data-public-nav-menu
          className="absolute inset-x-0 top-[50px] h-[calc(100dvh-50px)] z-40 bg-surface flex flex-col overscroll-contain shadow-2xl"
        >
          <nav
            key={`${screen.level}-${'group' in screen ? screen.group.key : 'root'}-${'category' in screen ? screen.category.label : ''}`}
            className="flex-1 overflow-y-auto overscroll-contain"
          >
            {screen.level > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="w-full flex items-center gap-1 px-[10px] py-3 border-b border-line text-ink-muted"
              >
                <ChevronLeft size={18} />
                <span className="text-sm font-medium">
                  {screen.level === 2 ? screen.category.label : screen.level === 1 ? screen.group.label : 'Menu'}
                </span>
              </button>
            )}

            {screen.level === 0 && TOP_GROUPS.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => setScreen({ level: 1, group })}
                className="w-full flex items-center justify-between px-[10px] py-4 border-b border-line text-ink"
              >
                <span className="text-[12px] font-bold">{group.label}</span>
                <ChevronRight size={18} className="text-ink-faint" />
              </button>
            ))}

            {screen.level === 1 && screen.group.links && screen.group.links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="flex items-center px-[10px] py-4 border-b border-line text-ink"
              >
                <span className="text-[12px] font-bold">{item.label}</span>
              </Link>
            ))}

            {/* A leaf with `sections` (Wedding's Men/Women) is a genuine
                submenu — drill in. A plain leaf (Men/Women/Corporate &
                Teams' categories) goes straight to /search, filtered — no
                intermediate in-menu screen — but still shows the '>'
                chevron, since landing on /search's category chip carousel
                (findChipSetKey in search/page.tsx) is its own "next page"
                of sorts, per explicit direction. */}
            {screen.level === 1 && !screen.group.links && screen.group.categories.map((category) => (
              category.sections ? (
                <button
                  key={category.label}
                  type="button"
                  onClick={() => openCategory(screen.group, category)}
                  className="w-full flex items-center justify-between px-[10px] py-4 border-b border-line text-ink"
                >
                  <span className="text-[12px] font-bold">{category.label}</span>
                  <ChevronRight size={18} className="text-ink-faint" />
                </button>
              ) : (
                <Link
                  key={category.label}
                  href={leafSearchHref(category)}
                  onClick={closeMenu}
                  className="flex items-center justify-between px-[10px] py-4 border-b border-line text-ink"
                >
                  <span className="text-[12px] font-bold">{category.label}</span>
                  <ChevronRight size={18} className="text-ink-faint" />
                </Link>
              )
            ))}

            {screen.level === 2 && screen.category.sections && screen.category.sections.length === 1 && screen.category.sections[0].flat && (() => {
              const section = screen.category.sections[0];
              // Same clickable-fallback as /search's carousel: a tier chip
              // with no href (Clearance/Wedding/Premium/Luxury/New) still
              // navigates — to the base "All X" search — rather than doing
              // nothing, since a dead row in a tap-through list reads as
              // broken. "All X" is always the first item and always real.
              const baseHref = section.items.find((i) => i.href)?.href;
              return (
                <>
                  {section.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href ?? baseHref ?? '/search'}
                      onClick={closeMenu}
                      className="flex items-center px-[10px] py-4 border-b border-line"
                    >
                      <span className={`text-[12px] font-bold ${item.href ? 'text-ink' : 'text-ink-faint'}`}>
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </>
              );
            })()}

            {screen.level === 2 && screen.category.sections && !(screen.category.sections.length === 1 && screen.category.sections[0].flat) && (
              <>
                {screen.category.sections.map((section) => (
                  <AccordionSection
                    key={section.key}
                    label={section.label}
                    open={openSection === section.key}
                    onToggle={() => toggleSection(section.key)}
                  >
                    {section.swatches ? (
                      <div className="flex flex-wrap gap-4 py-2">
                        {section.items.map((item) => (
                          <div key={item.label} className="flex flex-col items-center gap-1">
                            <span className="w-6 h-6 rounded-full border border-line-strong" style={{ backgroundColor: item.hex }} />
                            <span className="text-[10px] text-ink-muted">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      section.items.map((item) => (
                        item.href ? (
                          <Link key={item.label} href={item.href} onClick={closeMenu} className="block py-2 text-sm text-ink">
                            {item.label}
                          </Link>
                        ) : (
                          <span key={item.label} className="block py-2 text-sm text-ink-faint">
                            {item.label}
                          </span>
                        )
                      ))
                    )}
                  </AccordionSection>
                ))}
              </>
            )}

          </nav>

          {/* Points at /map, not /search — this button's whole reason for
              existing is getting someone to a bookable shop, and /map
              shows shop pins directly (→ shop profile → Book), while
              /search leads with catalog items and only surfaces a shop
              list once you've typed a text query. Confirmed with the user
              after this exact mismatch was reported live. */}
          <Link
            href="/map"
            onClick={closeMenu}
            className="shrink-0 h-9 flex items-center justify-center bg-ink text-white text-xs font-bold uppercase tracking-widest hover:bg-ink/90 active:opacity-80 transition-colors"
          >
            Search Stores
          </Link>
          <Link
            href="/track"
            onClick={closeMenu}
            className="shrink-0 h-9 flex items-center justify-center border-t border-line bg-surface text-ink text-xs font-bold uppercase tracking-widest hover:bg-sunken active:opacity-80 transition-colors"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            Track Your Production
          </Link>
        </div>
      )}
    </header>
  );
}

function AccordionSection({
  label, open, onToggle, children,
}: {
  readonly label: string;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-[10px] py-3 text-ink"
      >
        <span className="text-[13px] font-bold">{label}</span>
        {open ? <ChevronUp size={16} className="text-ink-faint" /> : <ChevronDown size={16} className="text-ink-faint" />}
      </button>
      {open && <div className="px-[10px] pb-3">{children}</div>}
    </div>
  );
}
