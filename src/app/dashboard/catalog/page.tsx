'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Image as ImageIcon, Megaphone, Eye, TrendingUp, Star } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CatalogItem } from '@/components/catalog/catalogHelpers';
import CatalogItemCard from '@/components/catalog/CatalogItemCard';
import CatalogDeleteModal from '@/components/catalog/CatalogDeleteModal';
import CatalogPreviewModal from '@/components/catalog/CatalogPreviewModal';
import CatalogModuleTabs from '@/components/catalog/CatalogModuleTabs';
import PromoPostModal from '@/components/promotions/PromoPostModal';
import ShopWideNote from '@/components/shared/ShopWideNote';
import PageHeader from '@/components/shared/PageHeader';
import StatBand from '@/components/shared/StatBand';
import { useToast } from '@/context/ToastContext';

export default function CatalogPage() {
  const { shop, user } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<CatalogItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [sortOrder, setSortOrder] = useState<'' | 'price_desc' | 'price_asc'>('');

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

  const handleView = (id: number) => {
    router.push(`/dashboard/catalog/${id}`);
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/catalog/${deletingId}`);
      setItems(prev => prev.filter(i => i.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch {
      toast.error('Failed to remove item from catalog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return <div className="text-ink-faint py-12 text-center animate-pulse">Loading catalog...</div>;
  }

  const uniq = (arr: (string | undefined | null)[]) =>
    Array.from(new Set(arr.filter((v): v is string => !!v && v.trim() !== ''))).sort((a, b) => a.localeCompare(b));
  const categoryOptions = uniq(items.map(i => i.garment_type));
  const colorOptions = uniq(items.map(i => i.color));
  const sizeOptions = uniq(items.flatMap(i => (Array.isArray(i.sizes) ? i.sizes : [])));
  const filteredItems = items
    .filter(i =>
      (!searchQuery || i.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) &&
      (!filterCategory || i.garment_type === filterCategory) &&
      (!filterColor || i.color === filterColor) &&
      (!filterSize || (Array.isArray(i.sizes) && i.sizes.includes(filterSize)))
    )
    .sort((a, b) => {
      if (sortOrder === 'price_desc') return Number(b.price) - Number(a.price);
      if (sortOrder === 'price_asc') return Number(a.price) - Number(b.price);
      return 0;
    });
  const hasActiveFilter = !!(searchQuery || filterCategory || filterColor || filterSize);
  const filterSelectClass = 'px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Showroom"
        title="Catalog Showcase"
        description={<>Manage the garments showcased to your customers. <ShopWideNote /></>}
        actions={
          <>
            <button
              onClick={() => setIsPromoModalOpen(true)}
              className="flex items-center gap-2 bg-surface border border-line text-ink-body hover:bg-sunken px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors min-h-11 shadow-2xs cursor-pointer"
            >
              <Megaphone size={16} />
              <span className="hidden sm:inline">Generate Promo Post</span>
              <span className="sm:hidden">Promo</span>
            </button>
            <Link
              href="/dashboard/catalog/new"
              className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors min-h-11 shadow-2xs cursor-pointer"
            >
              <Plus size={17} />
              Create New Item
            </Link>
          </>
        }
      />
      <CatalogModuleTabs />

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
            className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Plus size={18} />
            Create First Item
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by item name..." className="w-56" />
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Filter</span>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={filterSelectClass}>
              <option value="">All Categories</option>
              {categoryOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={filterColor} onChange={e => setFilterColor(e.target.value)} className={filterSelectClass}>
              <option value="">All Colors</option>
              {colorOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={filterSize} onChange={e => setFilterSize(e.target.value)} className={filterSelectClass}>
              <option value="">All Sizes</option>
              {sizeOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
              className={filterSelectClass}
              aria-label="Sort by price"
            >
              <option value="">Sort: Default</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
            </select>
            {(hasActiveFilter || sortOrder) && (
              <button
                onClick={() => { setSearchQuery(''); setFilterCategory(''); setFilterColor(''); setFilterSize(''); setSortOrder(''); }}
                className="text-xs font-semibold text-danger hover:underline"
              >
                Clear filters
              </button>
            )}
            <span className="text-xs text-ink-faint ml-auto">{filteredItems.length} of {items.length}</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-surface border border-line rounded-xl p-10 text-center text-sm text-ink-muted">
              No items match the selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredItems.map(item => (
                <CatalogItemCard
                  key={item.id}
                  item={item}
                  onView={handleView}
                  onOpenDelete={openDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CatalogDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />

      <CatalogPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewItem(null);
        }}
        item={previewItem}
      />

      <PromoPostModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        mode="catalog"
      />
    </div>
  );
}
