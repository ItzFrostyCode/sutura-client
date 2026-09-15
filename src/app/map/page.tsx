'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import PublicNav from '@/components/shared/PublicNav';
import SearchInput from '@/components/shared/SearchInput';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';

// Leaflet touches `window` — must be client-only, matching the exact
// pattern already proven by BranchesMap.tsx/SingleBranchMap.tsx.
const DiscoveryMap = dynamic(() => import('@/components/discovery/DiscoveryMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
      Loading map…
    </div>
  ),
});

interface ShopApiBranch {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  landmark: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}

interface ShopApiResult {
  slug: string;
  name: string;
  branches: ShopApiBranch[];
}

export default function MapPage() {
  const [q, setQ] = useState('');
  const [branches, setBranches] = useState<DiscoveryMapBranch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string> = {};
      if (q.trim()) params.q = q.trim();

      api.get('/public/shops', { params })
        .then((res) => {
          const shops: ShopApiResult[] = res.data.data ?? [];
          const pins: DiscoveryMapBranch[] = shops.flatMap((shop) =>
            shop.branches
              .filter((b) => b.latitude != null && b.longitude != null && !Number.isNaN(Number(b.latitude)) && !Number.isNaN(Number(b.longitude)))
              .map((b) => ({
                shopSlug: shop.slug,
                shopName: shop.name,
                branchId: b.id,
                branchName: b.name,
                address: b.address,
                city: b.city,
                landmark: b.landmark,
                latitude: Number(b.latitude),
                longitude: Number(b.longitude),
              }))
          );
          setBranches(pins);
        })
        .catch(() => setBranches([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [q]);

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <h1 className="text-display text-2xl text-ink mb-1">Shops Near You</h1>
        <p className="text-sm text-ink-muted mb-6">Every verified tailoring shop branch in Davao City, pinned on the map.</p>

        <SearchInput value={q} onChange={setQ} placeholder="Filter by shop name or garment type..." className="mb-6 max-w-md" />

        {loading ? (
          <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted" style={{ height: 520 }}>
            Loading shops…
          </div>
        ) : (
          <DiscoveryMap branches={branches} />
        )}
      </main>
    </div>
  );
}
