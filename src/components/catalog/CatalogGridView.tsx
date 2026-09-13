'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Image as ImageIcon, Eye, TrendingUp, Star, SlidersHorizontal, RotateCcw } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import Link from 'next/link';

import { CatalogItem } from '@/components/catalog/catalogHelpers';
import CatalogItemCard from '@/components/catalog/CatalogItemCard';
import CatalogDeleteModal from '@/components/catalog/CatalogDeleteModal';
import CatalogPreviewModal from '@/components/catalog/CatalogPreviewModal';
import StatBand from '@/components/shared/StatBand';
import { useToast } from '@/context/ToastContext';
import { CardGridSkeleton } from '@/components/ui/Skeleton';

export default function CatalogGridView() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<CatalogItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGarmentType, setFilterGarmentType] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [sortOrder, setSortOrder] = useState<'' | 'price_desc' | 'price_asc'>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchItems = useCallback(() => {
    if (shop?.id) {
      setTimeout(() => setLoading(true), 0);
      api.get(`/shops/${shop.id}/catalog`)
        .then(res => {
          setItems(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user?.id) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop, user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handlePreview = (item: CatalogItem) => {
    setPreviewItem(item);
    setIsPreviewModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!shop?.id || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/catalog/${deletingId}`);
      toast.success('Catalog item deleted successfully.');
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const garmentTypes = Array.from(new Set(items.map(i => i.garment_type).filter(Boolean))) as string[];
  const allSizes = Array.from(new Set(items.flatMap(i => i.sizes || []))).filter(Boolean);

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = !filterGarmentType || item.garment_type === filterGarmentType;
      const matchesSize = !filterSize || (item.sizes && item.sizes.includes(filterSize));
      return matchesSearch && matchesType && matchesSize;
    })
    .sort((a, b) => {
      if (sortOrder === 'price_desc') return Number(b.price) - Number(a.price);
      if (sortOrder === 'price_asc') return Number(a.price) - Number(b.price);
      return 0;
    });
  const hasActiveFilter = Boolean(searchQuery || filterGarmentType || filterSize);
  const activeFiltersCount = (filterGarmentType ? 1 : 0) + (filterSize ? 1 : 0);

  if (loading) {
    return <CardGridSkeleton count={8} cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />;
  }

  return (
    <div className="space-y-6">
      {items.length > 0 && (() => {
        const totalViews = items.reduce((sum, i) => sum + (i.views_count || 0), 0);
        const totalRevenue = items.reduce((sum, i) => sum + Number(i.total_revenue || 0), 0);
        const rated = items.filter(i => i.reviews_count > 0);
        const avgRating = rated.length > 0
          ? rated.reduce((sum, i) => sum + Number(i.reviews_avg_rating || 0), 0) / rated.length
          : null;
        return (
          <StatBand
            items={[
              { label: 'Catalog Size', value: items.length, icon: ImageIcon },
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye },
              { label: 'Catalog Revenue', value: `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, icon: TrendingUp, tone: 'sage' },
              { label: 'Avg. Rating', value: avgRating !== null ? avgRating.toFixed(1) : '—', icon: Star },
            ]}
          />
        );
      })()}

      {items.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-ink-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ink mb-2">No items in your catalog</h3>
          <p className="text-ink-muted text-sm mb-6 max-w-md mx-auto">
            Showcase your best tailoring work. Add items like Tuxedos, Dresses, or suits with detailed specs and images.
          </p>
          <Link
            href="/dashboard/catalog/new"
            className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            <span>Create Item</span>
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xs">
          {/* Main Search and Action Toolbar */}
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-canvas/30">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search catalog garments, designs..."
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-taupe text-white border-taupe shadow-2xs'
                    : 'bg-surface border-line text-ink hover:bg-canvas'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    showFilters || activeFiltersCount > 0 ? 'bg-white/20 text-white' : 'bg-canvas text-ink-muted'
                  }`}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as '' | 'price_desc' | 'price_asc')}
                className="bg-surface border border-line text-ink rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-taupe outline-hidden cursor-pointer"
                aria-label="Sort by Price"
              >
                <option value="">Featured / Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Collapsible Filter Tray */}
          {showFilters && (
            <div className="p-4 sm:p-5 border-t border-line bg-surface/50 flex flex-wrap items-center gap-4 animate-fade-in text-xs">
              {garmentTypes.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-muted">Type:</span>
                  <select
                    value={filterGarmentType}
                    onChange={e => setFilterGarmentType(e.target.value)}
                    className="bg-surface border border-line text-ink rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-taupe outline-hidden cursor-pointer"
                  >
                    <option value="">All Types</option>
                    {garmentTypes.map(gt => (
                      <option key={gt} value={gt}>{gt}</option>
                    ))}
                  </select>
                </div>
              )}

              {allSizes.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-muted">Available Sizes:</span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setFilterSize('')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                        !filterSize ? 'bg-taupe text-white border-taupe' : 'bg-surface text-ink-muted border-line hover:border-taupe'
                      }`}
                    >
                      All
                    </button>
                    {allSizes.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFilterSize(filterSize === s ? '' : s)}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                          filterSize === s ? 'bg-taupe text-white border-taupe' : 'bg-surface text-ink-muted border-line hover:border-taupe'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterGarmentType('');
                    setFilterSize('');
                    setSortOrder('');
                  }}
                  className="flex items-center gap-1 text-ink-muted hover:text-ink font-semibold ml-auto cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          )}

          {/* Items Grid */}
          <div className="p-4 sm:p-5">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-ink-muted">
                <p>No items matched your current filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterGarmentType('');
                    setFilterSize('');
                  }}
                  className="mt-2 text-taupe font-semibold hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredItems.map(item => (
                  <CatalogItemCard
                    key={item.id}
                    item={item}
                    onView={(id) => {
                      const found = items.find(i => i.id === id);
                      if (found) handlePreview(found);
                    }}
                    onOpenDelete={handleDeleteClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <CatalogPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        item={previewItem}
      />

      <CatalogDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
