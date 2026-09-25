'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Ruler, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';

interface CatalogItemMini {
  id: number;
  name: string;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  size_chart_image_url?: string | null;
}

export default function SizeGuidePage({ params }: Readonly<{ params: Promise<{ store_id: string; item_id: string }> }>) {
  const { store_id: storeId, item_id: itemId } = use(params);
  const router = useRouter();
  const gate = useGuestGatedHref();

  const [item, setItem] = useState<CatalogItemMini | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/catalog/${storeId}/${itemId}`)
      .then(res => setItem(res.data.data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [storeId, itemId]);

  const columns = item?.size_chart_columns ?? [];
  const rows = item?.size_chart_rows ?? [];
  const chartImage = item?.size_chart_image_url ?? '';

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-surface border-b border-line px-4 h-10 flex items-center justify-center relative">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="absolute left-4 p-1 text-ink-muted">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-bold text-ink">Size Guide</h1>
      </div>

      <main className="flex-1 w-full px-[10px] py-[10px] max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>
        ) : (
          <>
            {/* Measurements quick link banner */}
            <Link
              href={gate('/account/measurements')}
              className="flex items-center gap-3 bg-surface border border-line rounded-2xl p-3 hover:bg-sunken transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
                <Ruler size={16} className="text-taupe" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink">Need a tailored custom fit?</p>
                <p className="text-[11px] text-ink-muted">View your store-verified fittings in My Measurements</p>
              </div>
              <span className="text-xs font-semibold text-taupe flex items-center gap-0.5 shrink-0">
                View <ChevronRight size={13} />
              </span>
            </Link>

            <div className="mt-4">
              <h2 className="text-sm font-bold text-ink mb-2">Product Measurements</h2>

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
                        <tr key={row.size} className="border-t border-line">
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
                <p className="text-sm text-ink-faint">No size guide available yet for this item — sizes follow this store&apos;s own standard. Contact the store if you&apos;re unsure.</p>
              ) : null}

              {chartImage && (
                <div className="mt-3 relative w-full h-[220px] rounded-lg overflow-hidden border border-line bg-surface">
                  <Image src={chartImage} alt="Size Guide visual" className="object-cover object-center" fill />
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
