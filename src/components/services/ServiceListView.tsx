'use client';

import React from 'react';
import {
  Loader2, Copy, DollarSign, Pencil, Trash2,
  Image as ImageIcon, Clock, Tag, Layers,
} from 'lucide-react';
import { Service, SERVICE_TYPES, SERVICE_TYPE_META } from './serviceHelpers';
import { getActiveSale } from '@/lib/salePricing';
import SearchInput from '@/components/shared/SearchInput';

interface ServiceListViewProps {
  readonly filteredServices: Service[];
  readonly loading: boolean;
  readonly search: string;
  readonly onSearchChange: (val: string) => void;
  readonly categoryFilter: string;
  readonly onCategoryFilterChange: (val: string) => void;
  readonly allCategories: string[];
  readonly actionLoadingId: number | null;
  readonly onDuplicate: (service: Service) => Promise<void>;
  readonly onEdit: (service: Service) => void;
  readonly onDelete: (id: number) => void;
  readonly onOpenSale: (service: Service) => void;
}

export default function ServiceListView({
  filteredServices,
  loading,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  allCategories,
  actionLoadingId,
  onDuplicate,
  onEdit,
  onDelete,
  onOpenSale,
}: ServiceListViewProps) {
  return (
    <div className="space-y-4 text-ink">
      {/* Search + Filter Bar — bulk select/delete removed (it deleted 9 real
          services with zero confirmation in a real incident); each service
          is deleted individually via its own card, which already confirms
          first. Stacks to a column on mobile instead of squeezing a search
          box + dropdown into one row. */}
      <div className="bg-surface border border-line rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchInput value={search} onChange={onSearchChange} placeholder="Search services..." className="flex-1 min-w-0" />

          {/* Category filter — a dropdown, not a chip wall. Real shops
              routinely have a distinct category string per service (13
              categories across 9 services isn't unusual), and rendering
              that as pill buttons wrapped across multiple rows read as
              visual clutter, not a useful filter. Same dropdown pattern as
              the Staff List's Role/Status/Workload/Branch filters. */}
          {allCategories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-canvas border border-line rounded-xl text-sm text-ink focus:outline-none focus:border-taupe transition-colors"
              aria-label="Filter by category"
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`skeleton-${i}`} className="bg-surface border border-line rounded-2xl overflow-hidden animate-pulse">
              <div className="h-40 bg-line" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-line rounded w-3/4" />
                <div className="h-3 bg-line rounded w-1/2" />
                <div className="h-5 bg-line rounded w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredServices.length === 0 && (
        <div className="bg-surface border border-line rounded-2xl py-20 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-canvas border border-line flex items-center justify-center mb-4">
            <ImageIcon size={24} className="text-ink-faint" />
          </div>
          <p className="text-sm font-semibold text-ink">
            {categoryFilter === 'All' ? 'No services yet' : `No services in "${categoryFilter}"`}
          </p>
          <p className="text-xs text-ink-faint mt-1">
            {categoryFilter === 'All' ? 'Click "Add Service" to create your first one.' : 'Try a different category filter.'}
          </p>
        </div>
      )}

      {/* Card Grid */}
      {!loading && filteredServices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredServices.map((service) => {
            const isLoading = actionLoadingId === service.id;

            return (
              <div
                key={service.id}
                className="relative bg-surface border border-line rounded-2xl overflow-hidden transition-all duration-200 group hover:border-taupe/40"
              >
                {/* Status badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    service.is_active
                      ? 'bg-sage/10 text-sage border-sage/20'
                      : 'bg-zinc-100 text-ink-faint border-zinc-200'
                  }`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Image area */}
                <div className="h-40 bg-canvas border-b border-line overflow-hidden">
                  {service.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-ink-faint">
                      <ImageIcon size={28} />
                      <span className="text-[11px]">No image</span>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  {/* Name + category */}
                  <div>
                    <h3 className="font-semibold text-ink text-sm leading-tight line-clamp-1">{service.name}</h3>
                    {service.categories && service.categories.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Tag size={10} className="text-ink-faint shrink-0" />
                        <span className="text-[11px] text-ink-faint truncate">{service.categories.join(', ')}</span>
                      </div>
                    )}
                    {service.service_types && service.service_types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {service.service_types.map(st => {
                          const meta = SERVICE_TYPE_META[st];
                          const TypeIcon = meta.icon;
                          return (
                            <span key={st} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.bg} ${meta.text} border ${meta.border}`}>
                              <TypeIcon size={10} />
                              {SERVICE_TYPES.find(t => t.value === st)?.label || st}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Price / turnaround / min-qty stats */}
                  {(service.base_price || service.estimated_days || (service.service_types?.includes('bulk_sublimation') && service.min_order_qty && service.min_order_qty > 1)) && (
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-body font-medium">
                      {service.base_price && (() => {
                        const activeSale = getActiveSale({ price: service.base_price ?? 0, sale_price: service.sale_price, sale_starts_at: service.sale_starts_at, sale_ends_at: service.sale_ends_at });
                        return activeSale ? (
                          <span className="flex items-center gap-1.5">
                            <DollarSign size={11} className="text-rose-600" />
                            <span className="line-through text-ink-faint">₱{activeSale.original.toLocaleString()}</span>
                            <span className="text-rose-600 font-bold">₱{activeSale.sale.toLocaleString()}</span>
                            <span className="text-[9px] font-bold text-white bg-rose-600 px-1.5 py-0.5 rounded-full">{activeSale.percentOff}% OFF</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <DollarSign size={11} className="text-sage" />
                            ₱{Number.parseFloat(service.base_price).toLocaleString()}
                          </span>
                        );
                      })()}
                      {service.estimated_days ? (
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-ink-faint" />
                          {service.estimated_days}d turnaround
                        </span>
                      ) : null}
                      {service.service_types?.includes('bulk_sublimation') && service.min_order_qty && service.min_order_qty > 1 && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          <Layers size={10} />
                          Min {service.min_order_qty} pcs
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {service.description && (
                    <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">{service.description}</p>
                  )}

                  {/* Included services, priced where available */}
                  {service.tags && service.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-line mt-2">
                      {service.tags.slice(0, 5).map((tag, idx) => {
                        const tier = service.pricing?.find(p => p.label === tag);
                        return (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-canvas text-ink-body border border-line">
                            {tag}{tier && Number(tier.amount) > 0 ? ` — ₱${Number(tier.amount).toLocaleString()}` : ''}
                          </span>
                        );
                      })}
                      {service.tags.length > 5 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-line text-ink-body">
                          +{service.tags.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 pt-1">
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin text-ink-faint mx-auto" />
                    ) : (
                      <>
                        <button
                          onClick={() => onEdit(service)}
                          title="Edit"
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-ink-body bg-canvas hover:bg-sunken rounded-lg transition-colors"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => onDuplicate(service)}
                          title="Duplicate"
                          className="flex items-center justify-center p-1.5 text-ink-faint hover:text-taupe hover:bg-canvas rounded-lg transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => onOpenSale(service)}
                          title="Set Sale Price"
                          className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${service.sale_price != null ? 'text-rose-600' : 'text-ink-faint hover:text-rose-600 hover:bg-rose-50'}`}
                        >
                          <Tag size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(service.id)}
                          title="Delete"
                          className="flex items-center justify-center p-1.5 text-ink-faint hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
