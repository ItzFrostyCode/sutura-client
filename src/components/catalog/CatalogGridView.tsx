'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { getMediaUrl } from '@/lib/media';
import { CatalogItem } from '@/components/catalog/catalogHelpers';
import SearchInput from '@/components/shared/SearchInput';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { apparelReviewBadge } from './ApparelReviewNotice';

// Photos and descriptions only: no metric cards, filter sidebar, sort chips,
// prices, ratings or sold counts. Each card is the main photo, the name and
// the start of the description.
function DesignCard({ item }: Readonly<{ item: CatalogItem }>) {
  const photo = item.images.find(i => i.is_primary) ?? item.images[0];
  const badge = apparelReviewBadge(item.apparel_review) ?? (item.is_active === false ? 'Paused' : undefined);
  return (
    <Link
      href={`/dashboard/catalog/${item.id}`}
      className="group block bg-white border border-line hover:border-taupe transition-colors"
    >
      <div className="relative aspect-[3/4] bg-sunken overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getMediaUrl(photo.image_url)}
            alt={item.name}
            className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint"><ImageIcon size={28} /></div>
        )}
        {badge && (
          <span className="absolute top-2 left-2 bg-ink/80 text-white text-[11px] font-semibold px-2 py-0.5">{badge}</span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-semibold text-ink line-clamp-1">{item.name}</p>
        {item.description?.trim() && (
          <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">{item.description}</p>
        )}
      </div>
    </Link>
  );
}

export default function CatalogGridView({ onCreate }: Readonly<{ onCreate?: () => void }>) {
  const { store, user } = useAuthStore();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = useCallback(() => {
    if (store?.id) {
      setTimeout(() => setLoading(true), 0);
      api.get(`/stores/${store.id}/catalog`)
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
  }, [store, user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return q ? items.filter(item => item.name.toLowerCase().includes(q)) : items;
  }, [items, searchQuery]);

  if (loading) {
    return <CardGridSkeleton count={10} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />;
  }

  if (items.length === 0) {
    return (
      <div className="bg-surface border border-line p-12 text-center">
        <ImageIcon className="w-12 h-12 text-ink-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-ink mb-2">No designs yet</h3>
        <p className="text-ink-muted text-sm mb-6 max-w-md mx-auto">
          Add photos and a description of your best tailoring work, like barong, gowns or suits.
        </p>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2 font-medium text-sm transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Design</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by design name..." className="w-full sm:max-w-sm" />

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-ink-muted">
          <p>No designs match &ldquo;{searchQuery}&rdquo;.</p>
          <button type="button" onClick={() => setSearchQuery('')} className="mt-2 text-taupe font-semibold hover:underline cursor-pointer">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredItems.map(item => <DesignCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
