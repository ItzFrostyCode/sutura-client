'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Image as ImageIcon, Megaphone } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import Link from 'next/link';

import { CatalogItem } from '@/components/catalog/catalogHelpers';
import CatalogItemCard from '@/components/catalog/CatalogItemCard';
import CatalogDeleteModal from '@/components/catalog/CatalogDeleteModal';
import CatalogPreviewModal from '@/components/catalog/CatalogPreviewModal';
import CatalogModuleTabs from '@/components/catalog/CatalogModuleTabs';
import PromoPostModal from '@/components/promotions/PromoPostModal';
import ShopWideNote from '@/components/shared/ShopWideNote';
import { useToast } from '@/context/ToastContext';

export default function CatalogPage() {
  const { shop, user } = useAuthStore();
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

  const fetchItems = useCallback(() => {
    if (shop?.id) {
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
    // Owner previewing their own item in the dashboard is not a real customer
    // view, so this only opens the modal — it must NOT increment views_count
    // (that's tracked from the public storefront page instead).
    const matched = items.find(i => i.id === id);
    if (matched) {
      setPreviewItem(matched);
      setIsPreviewModalOpen(true);
    }
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
    return <div className="text-[#A8A19A] py-12 text-center animate-pulse">Loading catalog...</div>;
  }

  const uniq = (arr: (string | undefined | null)[]) =>
    Array.from(new Set(arr.filter((v): v is string => !!v && v.trim() !== ''))).sort((a, b) => a.localeCompare(b));
  const categoryOptions = uniq(items.map(i => i.garment_type));
  const colorOptions = uniq(items.map(i => i.color));
  const sizeOptions = uniq(items.flatMap(i => (Array.isArray(i.sizes) ? i.sizes : [])));
  const filteredItems = items.filter(i =>
    (!searchQuery || i.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) &&
    (!filterCategory || i.garment_type === filterCategory) &&
    (!filterColor || i.color === filterColor) &&
    (!filterSize || (Array.isArray(i.sizes) && i.sizes.includes(filterSize)))
  );
  const hasActiveFilter = !!(searchQuery || filterCategory || filterColor || filterSize);
  const filterSelectClass = 'px-3 py-2 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe';

  return (
    <div className="space-y-6 pb-12 text-[#2D2A26]">
      <CatalogModuleTabs />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Catalog Showcase</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage the premium garments showcased to your customers.</p>
          <ShopWideNote />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsPromoModalOpen(true)}
            title="Generate Promo Post"
            className="flex items-center gap-2 bg-[#FAF6F3] border border-[#EBE6E0] text-[#524A44] hover:bg-[#F0EAE3] px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Megaphone size={18} />
            Generate Promo Post
          </button>
          <Link
            href="/dashboard/catalog/new"
            className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Plus size={18} />
            Create New Item
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-[#827A73] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2D2A26] mb-2">No items in your catalog</h3>
          <p className="text-[#827A73] text-sm mb-6 max-w-md mx-auto">
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
            <span className="text-xs font-semibold text-[#827A73] uppercase tracking-wider">Filter</span>
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
            {hasActiveFilter && (
              <button
                onClick={() => { setSearchQuery(''); setFilterCategory(''); setFilterColor(''); setFilterSize(''); }}
                className="text-xs font-semibold text-[#B26959] hover:underline"
              >
                Clear filters
              </button>
            )}
            <span className="text-xs text-[#A8A19A] ml-auto">{filteredItems.length} of {items.length}</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-white border border-[#EBE6E0] rounded-2xl p-10 text-center text-sm text-[#827A73]">
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
