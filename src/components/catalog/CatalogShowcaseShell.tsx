'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import CatalogGridView from '@/components/catalog/CatalogGridView';
import CatalogCreateModal from '@/components/catalog/create/CatalogCreateModal';
import { useCanManageOfferings } from '@/hooks/useCanManageOfferings';

// Catalog Designs is photos and descriptions only: no Analytics tab and no
// metric cards. "+ Create New" opens the create form in a modal.
export default function CatalogShowcaseShell() {
  const canManage = useCanManageOfferings();
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // /dashboard/catalog/new (and old links to it) land here with ?new=1.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') === '1') {
      setCreateOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Catalog Designs"
        description="Your garment designs: photos and descriptions customers can browse."
        actions={canManage ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            data-tour="catalog-create"
            className="flex items-center gap-1.5 min-h-11 bg-taupe hover:bg-taupe-hover text-white px-4 rounded-xl font-semibold text-sm transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Create New</span>
          </button>
        ) : undefined}
        inlineActions
      />
      <div data-tour="catalog-grid">
        <CatalogGridView key={refreshKey} onCreate={canManage ? () => setCreateOpen(true) : undefined} />
      </div>
      {createOpen && (
        <CatalogCreateModal
          isOpen
          onClose={() => setCreateOpen(false)}
          onCreated={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}
