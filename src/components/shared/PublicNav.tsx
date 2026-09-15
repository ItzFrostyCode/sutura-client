'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LogOut, User as UserIcon, Search, Map as MapIcon, Package } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { useAuthStore } from '@/store/useAuthStore';

const LINKS = [
  { href: '/map', label: 'Map', Icon: MapIcon },
  { href: '/track', label: 'Track Order', Icon: Package },
];

/**
 * Shared header for every public page — Shopee-style persistent search bar
 * in the header itself (logo left, search center, account right) instead
 * of only having search on the landing hero / top of /search. No cart icon
 * on the right -- this app has no add-to-cart concept, Map/Track + account
 * fill that slot instead.
 */
export default function PublicNav() {
  return (
    <nav className="border-b border-line bg-surface sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <BrandLogo iconOnly className="w-8 h-8" />
          <span className="font-serif font-bold text-lg tracking-tight text-ink hidden sm:inline">SUTURA</span>
        </Link>

        <Suspense fallback={<div className="flex-1" />}>
          <HeaderSearch />
        </Suspense>

        <NavRight />
      </div>
    </nav>
  );
}

function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-xl flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" size={15} />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search catalog items, shops..."
          className="w-full pl-9 pr-3 py-2 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
      >
        Search
      </button>
    </form>
  );
}

function NavRight() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      {LINKS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`p-2 rounded-lg transition-colors hidden sm:flex ${
              active ? 'text-taupe bg-sunken' : 'text-ink-muted hover:text-ink hover:bg-sunken'
            }`}
          >
            <Icon size={18} />
          </Link>
        );
      })}
      {isAuthenticated && user ? (
        <div className="flex items-center gap-1 pl-2 ml-1 border-l border-line">
          <span className="hidden md:flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-ink">
            <UserIcon size={14} className="text-ink-faint" />
            {user.name?.split(' ')[0] ?? 'Account'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="p-2 rounded-lg text-ink-muted hover:text-danger hover:bg-sunken transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="ml-1 px-3 py-2 rounded-lg text-sm font-medium text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
        >
          Log In
        </Link>
      )}
    </div>
  );
}
