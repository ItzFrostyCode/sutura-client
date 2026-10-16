'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicNav from '@/components/shared/PublicNav';
import PageBrandRow from '@/components/shared/publicNav/PageBrandRow';
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
    <div className="min-h-dvh flex flex-col bg-canvas">
      <div className="sticky top-0 z-50">
        <PublicNav isSticky={false} />
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto mobile-screen-margins py-6 sm:py-8">
        <PageBrandRow className="mb-2" />
        
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
            Explore every custom garment category, tailoring service, and alteration option available across SUTURA shops in Davao City.
          </p>
        </div>

        {/* Top Visual Bar: Shopee-Style 2-Row Grid Carousel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-muted">
              Main Categories
            </h2>
          </div>
          <CategoriesVisualGrid />
        </div>

        {/* Search Bar - Landing page rounded style with generous height, no filter */}
        <DirectorySearchBar
          value={query}
          onChange={setQuery}
          onSubmit={handleSearchSubmit}
          placeholder="Search categories or sub-categories, e.g. Barong, Wedding Gown, Uniforms, Alterations..."
          ariaLabel="Search categories or sub-categories"
          className="mb-6"
        />

        {/* A–Z Alphabet Index Bar & 4-Column Directory */}
        <CategoriesAlphabetDirectory query={query} />
      </main>

      <HomeFooter />
    </div>
  );
}
