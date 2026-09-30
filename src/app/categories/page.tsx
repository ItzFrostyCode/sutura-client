'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';
import HomeFooter from '@/components/home/HomeFooter';
import CategoriesShowcaseGrid from '@/components/categories/CategoriesShowcaseGrid';
import CategoriesServicesSection from '@/components/categories/CategoriesServicesSection';
import CategoriesAlphabetDirectory from '@/components/categories/CategoriesAlphabetDirectory';

export default function CategoriesPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <div className="sticky top-0 z-50">
        <PublicNav isSticky={false} />
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto mobile-screen-margins py-6 sm:py-8">
        <nav aria-label="Breadcrumb" className="mobile-caption text-ink-muted flex items-center gap-1.5 mb-4">
          <Link href="/" className="hover:text-ink">SUTURA</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">All Categories</span>
        </nav>

        <h1 className="mobile-h1 sm:tablet-h1 text-ink mb-2">All Categories</h1>
        <p className="mobile-body-md text-ink-muted max-w-2xl mb-6">
          Browse every apparel category and service SUTURA tailors offer — Men&apos;s, Women&apos;s, and
          Children&apos;s Apparel, plus Custom Tailoring, Alterations, Uniforms, Printing &amp; Sublimation,
          and Costume services.
        </p>

        <form onSubmit={handleSearchSubmit} className="relative mb-8">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a garment or service, e.g. Barong Tagalog, Alterations..."
            className="w-full h-12 sm:h-14 pl-11 pr-4 bg-surface border border-line focus:border-taupe focus:outline-none text-base text-ink placeholder:text-ink-faint"
          />
        </form>

        <div className="mb-10">
          <CategoriesShowcaseGrid />
        </div>

        <CategoriesServicesSection />

        <CategoriesAlphabetDirectory query={query} />
      </main>

      <HomeFooter />
    </div>
  );
}
