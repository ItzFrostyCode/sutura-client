'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DirectorySearchBar from '@/components/shared/DirectorySearchBar';
import HomeFooter from '@/components/home/HomeFooter';
import CategoriesVisualGrid from '@/components/categories/CategoriesVisualGrid';
import CategoriesAlphabetDirectory from '@/components/categories/CategoriesAlphabetDirectory';

export default function CategoriesPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <main className="flex-1 mx-auto w-full max-w-[960px] px-4 min-[481px]:px-6 min-[600px]:px-8 md:px-12 lg:px-0 py-6 sm:py-8">
        
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mobile-caption text-ink-muted flex items-center gap-1.5 mb-4">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">All Categories</span>
        </nav>

        {/* Page Title & Subtitle */}
        <div className="mb-6">
          <h1 className="mobile-h1 sm:tablet-h1 text-ink mb-2">All Categories</h1>
          <p className="mobile-body-md text-ink-muted max-w-2xl">
            Find a tailoring shop in Davao by the garment you need.
          </p>
        </div>

        <section aria-labelledby="garments-title">
          <h2 id="garments-title" className="mobile-h2 sm:tablet-h2 text-ink">Browse by garment</h2>
          <p className="mobile-body-sm mt-1 mb-4 text-ink-muted">Shops that make it, alter it or fix it.</p>
          <CategoriesVisualGrid className="mb-8" />

          <DirectorySearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearchSubmit}
            placeholder="Search a garment, e.g. barong, wedding gown, slacks"
            ariaLabel="Search garments"
            className="mb-6"
          />

        {/* A–Z Alphabet Index Bar & 4-Column Directory */}
          <CategoriesAlphabetDirectory query={query} />
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
