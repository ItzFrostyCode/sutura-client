'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Store, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import PublicNav from '@/components/shared/PublicNav';
import SearchInput from '@/components/shared/SearchInput';
import { useAuthStore } from '@/store/useAuthStore';

interface ServiceResult {
  id: number;
  name: string;
  base_price: number | null;
  estimated_days: number | null;
  image_url: string | null;
  shop: { name: string; slug: string } | null;
}

const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function ServicesDirectoryPage() {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center text-sm text-ink-muted">Loading…</div>}>
      <ServicesDirectoryContent />
    </Suspense>
  );
}

function ServicesDirectoryContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);

  const [services, setServices] = useState<ServiceResult[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setPage(1); }, [q, sortBy]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string | number> = { per_page: 24, page };
      if (q.trim()) params.q = q.trim();
      if (sortBy) params.sort_by = sortBy;

      api.get('/public/services', { params })
        .then((res) => {
          setServices(res.data.data ?? []);
          setTotal(res.data.meta?.total ?? 0);
          setLastPage(res.data.meta?.last_page ?? 1);
        })
        .catch(() => { setServices([]); setTotal(0); setLastPage(1); })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [q, sortBy, page]);

  return (
    <div className="min-h-full flex flex-col bg-canvas">
      <PublicNav />
      <main className="flex-1 w-full px-[10px] py-[10px]">
        <h1 className="text-display text-xl text-ink mb-1">All Services</h1>
        <p className="text-sm text-ink-muted mb-3">Bespoke tailoring, alterations, sublimation, and more — offered across every shop on SUTURA.</p>

        <div className="mb-3 space-y-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search services, e.g. Alterations..." className="w-full" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading services…</div>}

        {!loading && services.length === 0 && (
          <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
            No services matched your search.
          </div>
        )}

        {!loading && services.length > 0 && (
          <>
            <p className="text-xs text-ink-faint mb-3">{total} service{total === 1 ? '' : 's'}</p>
            <div className="grid grid-cols-2 gap-[5px]">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={service.shop ? `/shop/${service.shop.slug}` : '/services'}
                  onClick={() => {
                    // No dedicated service detail page exists to mount a
                    // view-tracking effect on (clicking just lands on the
                    // shop page) — recorded on click instead, fire-and-forget.
                    if (user) api.post('/recently-viewed', { type: 'service', id: service.id }).catch(() => {});
                  }}
                  className="bg-surface border border-line overflow-hidden hover:border-line-strong transition-colors"
                >
                  <div className="aspect-video bg-sunken relative">
                    {service.image_url ? (
                      <Image
                        src={getMediaUrl(service.image_url)}
                        alt={service.name}
                        fill
                        unoptimized
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('[data-fallback]') as HTMLElement | null;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div data-fallback className={`w-full h-full items-center justify-center ${service.image_url ? 'hidden' : 'flex'}`}>
                      <Store size={20} className="text-ink-faint" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-ink line-clamp-2 leading-snug min-h-[2rem]">{service.name}</p>
                    {service.base_price !== null && (
                      <p className="text-sm font-bold text-taupe mt-1">₱{Number(service.base_price).toLocaleString()}</p>
                    )}
                    <p className="text-[11px] text-ink-faint mt-0.5 truncate">{service.shop?.name}</p>
                  </div>
                </Link>
              ))}
            </div>

            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg border border-line text-ink-muted hover:bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-ink-muted px-2">Page {page} of {lastPage}</span>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  className="p-2 rounded-lg border border-line text-ink-muted hover:bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
