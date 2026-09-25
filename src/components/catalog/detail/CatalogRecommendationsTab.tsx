'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Trash2, Image as ImageIcon } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { formatCatalogPrice } from '../catalogHelpers';
import { DetailedCatalogItem } from './detailTypes';

interface CatalogRecommendationsTabProps {
  recommendations: DetailedCatalogItem['recommendations'];
  onOpenAddRecModal: () => void;
  onRemoveRecommendation: (recItemId: number) => void;
}

export default function CatalogRecommendationsTab({
  recommendations,
  onOpenAddRecModal,
  onRemoveRecommendation,
}: CatalogRecommendationsTabProps) {
  const recList = recommendations || [];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-base font-bold text-ink">Related & Cross-Sell Designs</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Items suggested alongside this design on your public storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddRecModal}
          className="px-4 py-2 bg-taupe text-white text-xs font-bold rounded-xl hover:bg-[#8A7063] transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-center cursor-pointer"
        >
          <Plus size={15} />
          <span>Link Related Design</span>
        </button>
      </div>

      {recList.length === 0 ? (
        <div className="py-16 text-center text-ink-muted">
          <Sparkles size={38} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm font-semibold">No related items linked yet.</p>
          <p className="text-xs text-ink-faint mt-1 mb-5">
            Suggest complementary accessories, pairs, or similar silhouettes right here.
          </p>
          <button
            type="button"
            onClick={onOpenAddRecModal}
            className="px-4 py-2 bg-taupe text-white text-xs font-bold rounded-xl hover:bg-[#8A7063] transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus size={15} /> Link First Related Design
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recList.map((rec) => {
            const recItem = rec.recommended_item;
            if (!recItem) return null;
            const recImg = recItem.images?.[0]?.image_url;
            return (
              <div
                key={rec.id}
                className="bg-canvas border border-line rounded-xl p-3 flex flex-col justify-between gap-3 relative group hover:border-taupe transition-all"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-sunken shrink-0">
                    {recImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getMediaUrl(recImg)}
                        alt={recItem.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-muted">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <Link href={`/dashboard/catalog/${recItem.id}`} className="hover:underline">
                        <h4 className="text-xs font-bold text-ink truncate group-hover:text-taupe transition-colors">
                          {recItem.name}
                        </h4>
                      </Link>
                      <span className="text-[10px] text-taupe font-bold uppercase tracking-wider block mt-0.5">
                        {(rec.recommendation_type || 'similar').replaceAll('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-ink font-mono">
                      {formatCatalogPrice(recItem.price)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-line/60 text-[11px]">
                  <Link
                    href={`/dashboard/catalog/${recItem.id}`}
                    className="text-taupe font-semibold hover:underline"
                  >
                    View Overview →
                  </Link>
                  <button
                    type="button"
                    onClick={() => onRemoveRecommendation(recItem.id)}
                    className="text-ink-muted hover:text-red-600 transition-colors p-1 rounded cursor-pointer"
                    title="Unlink related design"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
