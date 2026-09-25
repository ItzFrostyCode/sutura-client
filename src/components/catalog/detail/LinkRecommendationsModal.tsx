'use client';

import React from 'react';
import { Search, Loader2, Plus, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import Modal from '@/components/Modal';
import { getMediaUrl } from '@/lib/media';
import { formatCatalogPrice } from '../catalogHelpers';
import { OtherCatalogOption } from './detailTypes';

interface LinkRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableItems: OtherCatalogOption[];
  loadingAvailable: boolean;
  recSearch: string;
  setRecSearch: (s: string) => void;
  selectedRecItemIds: number[];
  toggleRecSelection: (id: number) => void;
  setSelectedRecItemIds: (ids: number[]) => void;
  selectedRecType: string;
  setSelectedRecType: (type: string) => void;
  onSaveRecommendations: () => void;
  savingRec: boolean;
}

export default function LinkRecommendationsModal({
  isOpen,
  onClose,
  availableItems,
  loadingAvailable,
  recSearch,
  setRecSearch,
  selectedRecItemIds,
  toggleRecSelection,
  setSelectedRecItemIds,
  selectedRecType,
  setSelectedRecType,
  onSaveRecommendations,
  savingRec,
}: LinkRecommendationsModalProps) {
  const filteredAvailable = availableItems.filter(i =>
    i.name.toLowerCase().includes(recSearch.toLowerCase()) ||
    Boolean(i.material?.toLowerCase().includes(recSearch.toLowerCase()))
  );

  const getLinkRecButtonLabel = () => {
    if (selectedRecItemIds.length === 0) return 'Select Designs';
    const suffix = selectedRecItemIds.length === 1 ? '' : 's';
    return `Link ${selectedRecItemIds.length} Design${suffix}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Related Designs"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-ink-muted">
            {selectedRecItemIds.length > 0 ? (
              <span><strong>{selectedRecItemIds.length}</strong> selected as <strong>{selectedRecType}</strong></span>
            ) : (
              <span>Click cards to select</span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-body hover:bg-canvas rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveRecommendations}
              disabled={savingRec || selectedRecItemIds.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-taupe text-white text-xs font-bold rounded-xl hover:bg-[#8A7063] transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              {savingRec ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>{getLinkRecButtonLabel()}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5 text-ink">
        {/* Controls: Search + Relationship Type + Select All */}
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1 min-w-30">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={recSearch}
              onChange={e => setRecSearch(e.target.value)}
              placeholder="Search designs or fabric..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-line rounded-xl bg-canvas focus:outline-none focus:border-taupe"
            />
          </div>

          <select
            value={selectedRecType}
            onChange={e => setSelectedRecType(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-line rounded-xl bg-canvas focus:outline-none focus:border-taupe font-semibold text-ink capitalize shrink-0"
          >
            <option value="similar">Similar Silhouette</option>
            <option value="accessory">Matching Accessory</option>
            <option value="matching">Entourage Pair</option>
            <option value="complementary">Complementary</option>
          </select>

          {filteredAvailable.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedRecItemIds(
                selectedRecItemIds.length === filteredAvailable.length
                  ? []
                  : filteredAvailable.map(i => i.id)
              )}
              className="px-3 py-1.5 text-xs font-semibold text-taupe bg-taupe/10 hover:bg-taupe/20 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              {selectedRecItemIds.length === filteredAvailable.length ? 'Clear All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Visual Cards Grid */}
        {loadingAvailable ? (
          <div className="py-16 flex flex-col items-center justify-center text-ink-muted">
            <Loader2 size={28} className="animate-spin text-taupe mb-2" />
            <span className="text-xs font-medium">Loading store designs...</span>
          </div>
        ) : availableItems.length === 0 ? (
          <div className="py-16 text-center text-ink-muted text-xs bg-canvas rounded-2xl border border-line">
            No other catalog designs found in your store.
          </div>
        ) : filteredAvailable.length === 0 ? (
          <div className="py-16 text-center text-ink-muted text-xs bg-canvas rounded-2xl border border-line">
            No designs match &quot;{recSearch}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredAvailable.map((opt) => {
              const isSelected = selectedRecItemIds.includes(opt.id);
              const optImg = opt.images?.[0]?.image_url;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleRecSelection(opt.id)}
                  className={`rounded-xl overflow-hidden flex flex-col text-left transition-all relative cursor-pointer border ${
                    isSelected
                      ? 'border-taupe bg-taupe/10 ring-2 ring-taupe shadow-xs'
                      : 'border-line bg-surface hover:border-taupe/50 hover:bg-canvas shadow-2xs'
                  }`}
                >
                  <div className="aspect-4/3 w-full bg-sunken relative overflow-hidden shrink-0">
                    {optImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getMediaUrl(optImg)}
                        alt={opt.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isSelected ? 'scale-105' : ''
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-muted">
                        <ImageIcon size={20} />
                      </div>
                    )}

                    <div
                      className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-taupe text-white shadow-sm scale-110'
                          : 'bg-black/40 text-white/80 backdrop-blur-xs'
                      }`}
                    >
                      <CheckCircle2 size={14} className={isSelected ? 'fill-current text-white' : ''} />
                    </div>
                  </div>

                  <div className="p-2 flex flex-col flex-1 w-full bg-white justify-between gap-1">
                    <div>
                      <h4 className="text-xs font-bold text-ink line-clamp-2 leading-snug">
                        {opt.name}
                      </h4>
                      {opt.material && (
                        <span className="text-[10px] text-ink-muted truncate block mt-0.5">
                          {opt.material}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-taupe font-mono">
                      {formatCatalogPrice(opt.price)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
