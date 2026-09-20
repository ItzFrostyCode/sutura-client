'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, User, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { findRecommendedSize } from '@/lib/sizeRecommendation';

interface CatalogItemMini {
  id: number;
  name: string;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  size_chart_image_url?: string | null;
}

interface SizeProfile {
  height_cm: string | number | null;
  weight_kg: string | number | null;
  metrics: Record<string, number> | null;
}

export default function SizeGuidePage({ params }: Readonly<{ params: Promise<{ shop_id: string; item_id: string }> }>) {
  const { shop_id: shopId, item_id: itemId } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const gate = useGuestGatedHref();

  const [item, setItem] = useState<CatalogItemMini | null>(null);
  const [sizeProfile, setSizeProfile] = useState<SizeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/catalog/${shopId}/${itemId}`)
      .then(res => setItem(res.data.data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));

    if (isAuthenticated) {
      api.get('/my-size-profile')
        .then(res => setSizeProfile(res.data.data))
        .catch(() => setSizeProfile(null));
    }
  }, [shopId, itemId, isAuthenticated]);

  const columns = item?.size_chart_columns ?? [];
  const rows = item?.size_chart_rows ?? [];
  const chartImage = item?.size_chart_image_url ?? '';
  const recommendedSize = findRecommendedSize(columns, rows, sizeProfile?.metrics ?? null);

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-surface border-b border-line px-4 h-10 flex items-center justify-center relative">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="absolute left-4 p-1 text-ink-muted">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-bold text-ink">Size Guide</h1>
      </div>

      <main className="flex-1 w-full px-[10px] py-[10px]">
        {loading ? (
          <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>
        ) : (
          <>
            {/* Profile summary — same as the compact banner on the item page
                itself, just always-visible here since this page IS the size
                guide. "Input size" is guest-gated like every other account
                action from a public page. */}
            <a
              href={gate('/account/size-profile')}
              className="flex items-center gap-3 bg-surface border border-line rounded-2xl p-3"
            >
              <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
                <User size={16} className="text-ink-faint" />
              </div>
              <p className="flex-1 text-sm text-ink-body">
                {sizeProfile?.height_cm != null ? `${sizeProfile.height_cm} cm` : '– cm'}
                <span className="text-ink-faint mx-1.5">|</span>
                {sizeProfile?.weight_kg != null ? `${sizeProfile.weight_kg} kg` : '– kg'}
              </p>
              <span className="text-xs font-semibold text-taupe flex items-center gap-0.5 shrink-0">
                Input size <ChevronRight size={13} />
              </span>
            </a>

            <div className="mt-4">
              <h2 className="text-sm font-bold text-ink mb-2">Product Measurements</h2>

              <div className="bg-alert/10 border border-alert/20 rounded-lg px-3 py-2.5 mb-3 text-xs text-ink-body">
                {recommendedSize
                  ? <>Recommended: <strong className="text-ink">Size {recommendedSize}</strong></>
                  : 'No recommended size yet — fill in your Size Profile above.'}
              </div>

              {columns.length > 0 ? (
                <div className="overflow-x-auto border border-line rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface">
                        <th className="px-3 py-2 text-left font-semibold text-ink-body">Size</th>
                        {columns.map(col => (
                          <th key={col} className="px-3 py-2 text-left font-semibold text-ink-body">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-surface">
                      {rows.map(row => (
                        <tr key={row.size} className={`border-t border-line ${recommendedSize === row.size ? 'bg-alert/10' : ''}`}>
                          <td className="px-3 py-2 font-semibold text-ink whitespace-nowrap">{row.size}</td>
                          {row.values.map((val, ci) => (
                            <td key={`${row.size}-${ci}`} className="px-3 py-2 text-ink-body">{val || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !chartImage ? (
                <p className="text-sm text-ink-faint">No size guide available yet for this item — sizes follow this shop's own standard. Contact the shop if you're unsure.</p>
              ) : null}

              {chartImage && (
                <div className="mt-3 relative w-full h-[220px] rounded-lg overflow-hidden border border-line bg-surface">
                  <Image src={chartImage} alt="Size Guide visual" className="object-cover object-center" fill unoptimized />
                </div>
              )}

              {rows.length > 0 && (
                <p className="text-xs text-ink-faint mt-2">The measurements may vary slightly.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
