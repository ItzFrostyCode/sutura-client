'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import CatalogModuleTabs, { CatalogTabId } from '@/components/catalog/CatalogModuleTabs';
import CatalogGridView from '@/components/catalog/CatalogGridView';
import CatalogAnalyticsView from '@/components/catalog/CatalogAnalyticsView';
import CatalogReviewsView from '@/components/catalog/CatalogReviewsView';

interface CatalogShowcaseShellProps {
  readonly initialTab?: CatalogTabId;
}

function resolveTabFromPath(): CatalogTabId {
  if (typeof window === 'undefined') return 'catalog';
  const pathname = window.location.pathname;
  if (pathname.includes('/analytics')) {
    return 'analytics';
  }
  if (pathname.includes('/reviews')) {
    return 'reviews';
  }
  return 'catalog';
}

function CatalogShowcaseShellContent({ initialTab = 'catalog' }: CatalogShowcaseShellProps) {
  const [activeTab, setActiveTab] = useState<CatalogTabId>(() => {
    if (typeof window !== 'undefined') {
      const fromPath = resolveTabFromPath();
      if (fromPath !== 'catalog') return fromPath;
    }
    return initialTab;
  });

  // Sync tab with browser back/forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(resolveTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Seamless in-page tab switching without whole-panel unmount or reload
  const handleTabChange = useCallback((tabId: CatalogTabId, href: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined' && window.location.pathname !== href) {
      window.history.pushState(null, '', href);
      window.dispatchEvent(new Event('sutura-tab-change'));
    }
  }, []);

  const headerActions = (
    <Link
      href="/dashboard/catalog/new"
      className="flex items-center gap-1.5 bg-taupe hover:bg-taupe-hover text-white px-3.5 py-2 rounded-xl font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
    >
      <Plus size={15} />
      <span>Create New Item</span>
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* 
        Standard SUTURA PageHeader:
        - Eyebrow: "Collections"
        - Title: "Showroom"
        - Actions on the right
        - Tabs as children, sitting flush directly on the header bottom border rule
      */}
      <PageHeader
        eyebrow="Collections"
        title="Showroom"
        description="Curated garment designs, collection performance metrics, and client reviews."
        actions={headerActions}
      >
        <CatalogModuleTabs activeTab={activeTab} onTabChange={handleTabChange} />
      </PageHeader>

      {/* 
        Content below the tabs: ONLY this sub-panel switches when changing tabs.
        The header, title, and tabs stay completely stable without reloading!
      */}
      <div className="tab-content-panel">
        {activeTab === 'catalog' && <CatalogGridView />}
        {activeTab === 'analytics' && <CatalogAnalyticsView />}
        {activeTab === 'reviews' && <CatalogReviewsView />}
      </div>
    </div>
  );
}

export default function CatalogShowcaseShell({ initialTab = 'catalog' }: CatalogShowcaseShellProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taupe" />
        </div>
      }
    >
      <CatalogShowcaseShellContent initialTab={initialTab} />
    </Suspense>
  );
}
